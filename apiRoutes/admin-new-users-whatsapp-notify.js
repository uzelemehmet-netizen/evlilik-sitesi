import { getAdmin, requireCronSecret } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
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

function formatLine({ gender, ucCode, appId }) {
  const g = gender === 'female' ? 'Kadın' : gender === 'male' ? 'Erkek' : 'Belirsiz';
  const code = safeStr(ucCode) || '-';
  const id = safeStr(appId) ? safeStr(appId).slice(0, 12) : '';
  return `${g} • ${code}${id ? ` • ${id}` : ''}`;
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

    const { db, FieldValue } = getAdmin();

    const stateRef = db.collection('matchmakingAutomation').doc('new_users_whatsapp_notify');
    const nowMs = Date.now();

    // Lock to avoid double-send when multiple schedulers overlap.
    let lastNotifiedAtMs = 0;
    let locked = false;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(stateRef);
      const cur = snap.exists ? (snap.data() || {}) : {};

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

    // Fetch new applications since last checkpoint.
    const maxToSend = 25;
    const appsSnap = await db
      .collection('matchmakingApplications')
      .where('createdAtMs', '>', lastNotifiedAtMs)
      .orderBy('createdAtMs', 'asc')
      .limit(maxToSend)
      .get();

    if (!appsSnap || appsSnap.empty) {
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
      res.end(JSON.stringify({ ok: true, status: 'noop', lastNotifiedAtMs }));
      return;
    }

    const apps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

    // Load UC codes from matchmakingUsers
    const uids = apps.map((a) => safeStr(a.userId)).filter(Boolean);
    const userSnaps = await Promise.all(uids.map((uid) => db.collection('matchmakingUsers').doc(uid).get()));
    const ucByUid = {};
    for (let i = 0; i < uids.length; i += 1) {
      const uid = uids[i];
      const snap = userSnaps[i];
      const user = snap && snap.exists ? snap.data() || {} : {};
      const uc = safeStr(user.userCode) || safeStr(user?.publicProfile?.userCode);
      if (uc) ucByUid[uid] = uc;
    }

    const baseUrl = safeStr(process.env.APP_BASE_URL) || 'https://uniqah.com';
    const adminUrl = `${baseUrl.replace(/\/$/, '')}/admin`;

    const lines = [];
    for (const a of apps) {
      const gender = normalizeGender(a.gender);
      const uid = safeStr(a.userId);
      lines.push(
        formatLine({
          gender,
          ucCode: uid ? ucByUid[uid] : '',
          appId: a.id,
        })
      );
      if (lines.length >= 8) break;
    }

    const femaleCount = apps.filter((a) => normalizeGender(a.gender) === 'female').length;
    const maleCount = apps.filter((a) => normalizeGender(a.gender) === 'male').length;
    const otherCount = Math.max(0, apps.length - femaleCount - maleCount);

    const body = [
      `Uniqah: ${apps.length} yeni başvuru`,
      `Kadın: ${femaleCount} • Erkek: ${maleCount}${otherCount ? ` • Diğer: ${otherCount}` : ''}`,
      '',
      ...lines.map((l) => `- ${l}`),
      '',
      `Admin: ${adminUrl}`,
    ].join('\n');

    await sendTwilioWhatsApp({ body });

    const newLast = Math.max(
      ...apps.map((a) => (typeof a.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0)),
      lastNotifiedAtMs
    );

    await stateRef.set(
      {
        lockUntilMs: 0,
        lastNotifiedAtMs: newLast,
        lastSentAtMs: nowMs,
        lastSentCount: apps.length,
        lastSentSummary: {
          female: femaleCount,
          male: maleCount,
          other: otherCount,
        },
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
        sentCount: apps.length,
        female: femaleCount,
        male: maleCount,
        other: otherCount,
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
