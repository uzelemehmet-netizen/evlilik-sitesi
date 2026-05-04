import { getAdmin, requireCronSecret } from './_firebaseAdmin.js';
import { maskEmail } from './_pii.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function twilioConfigured() {
  const sid = safeStr(process.env.TWILIO_ACCOUNT_SID);
  const token = safeStr(process.env.TWILIO_AUTH_TOKEN);
  const from = safeStr(process.env.TWILIO_WHATSAPP_FROM);
  const to = safeStr(process.env.ADMIN_WHATSAPP_TO);
  return Boolean(sid && token && from && to);
}

async function sendTwilioWhatsApp({ body }) {
  const sid = safeStr(process.env.TWILIO_ACCOUNT_SID);
  const token = safeStr(process.env.TWILIO_AUTH_TOKEN);
  const from = safeStr(process.env.TWILIO_WHATSAPP_FROM);
  const to = safeStr(process.env.ADMIN_WHATSAPP_TO);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  const params = new URLSearchParams();
  params.set('From', from);
  params.set('To', to);
  params.set('Body', String(body || '').slice(0, 1500));

  const basic = Buffer.from(`${sid}:${token}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error('twilio_send_failed');
    err.statusCode = 502;
    err.details = text;
    throw err;
  }

  return text;
}

function msFromCreationTime(creationTime) {
  const s = safeStr(creationTime);
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function formatLine({ createdAtMs, email, uid, disabled }) {
  const when = createdAtMs ? new Date(createdAtMs).toISOString().replace('T', ' ').slice(0, 16) + 'Z' : '';
  const e = safeStr(email) ? maskEmail(email) : '-';
  const id = safeStr(uid) ? safeStr(uid).slice(0, 8) : '';
  const dis = disabled ? ' (disabled)' : '';
  return `${when} • ${e}${id ? ` • ${id}` : ''}${dis}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    requireCronSecret(req);

    if (!twilioConfigured()) {
      const err = new Error('twilio_not_configured');
      err.statusCode = 503;
      throw err;
    }

    const { auth, db, FieldValue } = getAdmin();

    const stateRef = db.collection('matchmakingAutomation').doc('new_signups_whatsapp_notify');
    const nowMs = Date.now();

    // Lock to avoid double-send when multiple schedulers overlap.
    let lastNotifiedAtMs = 0;
    let locked = false;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(stateRef);
      const cur = snap.exists ? snap.data() || {} : {};

      const lockUntilMs = safeNum(cur.lockUntilMs);
      if (lockUntilMs && lockUntilMs > nowMs) {
        locked = true;
        lastNotifiedAtMs = safeNum(cur.lastNotifiedAtMs);
        return;
      }

      lastNotifiedAtMs = safeNum(cur.lastNotifiedAtMs);
      tx.set(
        stateRef,
        {
          lockUntilMs: nowMs + 60_000,
          lockAtMs: nowMs,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
        { merge: true }
      );
    });

    if (locked) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'locked', lastNotifiedAtMs }));
      return;
    }

    // Firebase Auth doesn't support server-side query by creationTime.
    // For now: scan all users (works fine for small/medium user counts), filter by createdAtMs.
    const maxToSend = 25;
    const maxPages = 50; // 50k users upper bound

    let pageToken = undefined;
    const newUsers = [];
    let scanned = 0;

    for (let page = 0; page < maxPages; page += 1) {
      const result = await auth.listUsers(1000, pageToken);
      const users = Array.isArray(result?.users) ? result.users : [];

      for (const u of users) {
        scanned += 1;
        const createdAtMs = msFromCreationTime(u?.metadata?.creationTime);
        if (createdAtMs > lastNotifiedAtMs) {
          newUsers.push({
            uid: safeStr(u?.uid),
            email: safeStr(u?.email),
            disabled: !!u?.disabled,
            createdAtMs,
          });
        }
      }

      pageToken = result?.pageToken || null;
      if (!pageToken) break;
    }

    newUsers.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));

    if (!newUsers.length) {
      await stateRef.set(
        {
          lockUntilMs: 0,
          lastCheckedAtMs: nowMs,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
        { merge: true }
      );

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'noop', lastNotifiedAtMs, scannedUsers: scanned }));
      return;
    }

    const batch = newUsers.slice(0, maxToSend);
    const baseUrl = safeStr(process.env.APP_BASE_URL) || 'https://uniqah.com';
    const adminUrl = `${baseUrl.replace(/\/$/, '')}/admin`;

    const lines = batch.slice(0, 8).map((u) => `- ${formatLine(u)}`);

    const body = [
      `Uniqah: ${batch.length} yeni kayıt`,
      '',
      ...lines,
      batch.length > 8 ? `- (+${batch.length - 8} daha)` : '',
      '',
      `Admin: ${adminUrl}`,
    ]
      .filter(Boolean)
      .join('\n');

    await sendTwilioWhatsApp({ body });

    const newLast = Math.max(
      lastNotifiedAtMs,
      ...batch.map((u) => (typeof u.createdAtMs === 'number' && Number.isFinite(u.createdAtMs) ? u.createdAtMs : 0))
    );

    await stateRef.set(
      {
        lockUntilMs: 0,
        lastNotifiedAtMs: newLast,
        lastSentAtMs: nowMs,
        lastSentCount: batch.length,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      },
      { merge: true }
    );

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        status: 'sent',
        sentCount: batch.length,
        totalNewSinceCheckpoint: newUsers.length,
        scannedUsers: scanned,
        lastNotifiedAtMs: newLast,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: false,
        error: String(e?.message || 'server_error'),
        ...(e?.details ? { details: String(e.details).slice(0, 2000) } : {}),
      })
    );
  }
}
