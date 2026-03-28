import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { sendPushToUid } from './_push.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : null;
}

function isTruthy(v) {
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'yes';
}

function isStubApplication(a) {
  const source = safeStr(a?.source).toLowerCase();
  if (source === 'auto_stub') return true;
  if (a?.details?.autoBootstrap === true) return true;
  return false;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function normalizeMaritalStatus(v) {
  return safeStr(v).toLowerCase();
}

function hasMinimumProfileInApplicationDoc(a) {
  const app = a && typeof a === 'object' ? a : {};
  if (isStubApplication(app)) return false;
  const details = app?.details && typeof app.details === 'object' ? app.details : {};

  const fullName = safeStr(app?.fullName);
  const age = asNum(app?.age);
  const gender = normalizeGender(app?.gender);
  const city = safeStr(app?.city);
  const country = safeStr(app?.country);
  const nationality = safeStr(app?.nationality);
  const occupation = safeStr(details?.occupation) || safeStr(app?.occupation);
  const maritalStatus = normalizeMaritalStatus(details?.maritalStatus || app?.maritalStatus);

  if (!fullName) return false;
  if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) return false;
  if (!gender) return false;
  if (!city) return false;
  if (!country) return false;
  if (!nationality) return false;
  if (!occupation) return false;
  if (!maritalStatus) return false;

  if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
    const hasChildren = safeStr(details?.hasChildren || app?.hasChildren).toLowerCase();
    if (!hasChildren) return false;
    if (hasChildren === 'yes') {
      const cnt = asNum(details?.childrenCount);
      if (!(typeof cnt === 'number' && Number.isFinite(cnt) && cnt >= 1 && cnt <= 20)) return false;
    }
  }

  return true;
}

function isMissingContactNumber(app) {
  const a = app && typeof app === 'object' ? app : {};
  const w = safeStr(a?.whatsapp);
  return !w;
}

async function listTargetUids({ db, limit, sinceMs } = {}) {
  const qLimit = typeof limit === 'number' && Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 200;
  const minUpdatedAtMs = typeof sinceMs === 'number' && Number.isFinite(sinceMs) ? sinceMs : 0;

  let q = db.collection('matchmakingUsers');
  // Only users who ever enabled push.
  q = q.where('push.enabled', '==', true);

  // Keep the scan bounded.
  if (minUpdatedAtMs > 0) {
    q = q.where('updatedAtMs', '>=', minUpdatedAtMs);
  }

  q = q.orderBy('updatedAtMs', 'desc').limit(qLimit);

  const snap = await q.get();
  return snap.docs.map((d) => d.id).filter(Boolean);
}

async function pickBestApplicationForUid({ db, uid } = {}) {
  const u = safeStr(uid);
  if (!u) return null;

  // Try fast path: auto_stub id.
  try {
    const autoId = `auto_${u}`;
    const autoSnap = await db.collection('matchmakingApplications').doc(autoId).get();
    if (autoSnap.exists) {
      return { id: autoSnap.id, ...((autoSnap.data() || {}) ?? {}) };
    }
  } catch {
    // ignore
  }

  const appsSnap = await db
    .collection('matchmakingApplications')
    .where('userId', '==', u)
    .orderBy('updatedAtMs', 'desc')
    .limit(5)
    .get();

  if (appsSnap.empty) return null;

  const apps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

  // Prefer non-stub applications.
  const nonStub = apps.find((a) => !isStubApplication(a));
  return nonStub || apps[0] || null;
}

export default async function adminPushIncompleteApplicationOnce(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const dryRun = isTruthy(body?.dryRun);
    const limit = typeof body?.limit === 'number' ? body.limit : 200;
    const sinceMs = typeof body?.sinceMs === 'number' ? body.sinceMs : 0;
    const cursorUid = safeStr(body?.cursorUid);
    const useCursor = !!cursorUid;

    const title = safeStr(body?.title) || 'Başvurunu tamamla';
    const msgBody = safeStr(body?.body) || 'Eşleştirmeyi başlatmak için başvuru formunu tamamlaman gerekiyor.';
    const url = safeStr(body?.url) || '/evlilik/eslestirme-basvuru?w=1';

    const { db, FieldValue } = getAdmin();

    const candidates = await listTargetUids({ db, limit, sinceMs });
    const startIndex = useCursor ? Math.max(0, candidates.findIndex((x) => x === cursorUid) + 1) : 0;
    const slice = candidates.slice(startIndex, startIndex + Math.max(1, Math.min(60, Math.floor(limit || 200))));

    const nowMs = Date.now();
    const results = [];

    for (const uid of slice) {
      const userRef = db.collection('matchmakingUsers').doc(uid);
      const markerRef = userRef.collection('pushCampaigns').doc('incomplete_application_once_20260327');

      let shouldSend = false;
      let reason = '';

      await db.runTransaction(async (tx) => {
        const [uSnap, mSnap] = await Promise.all([tx.get(userRef), tx.get(markerRef)]);
        const user = uSnap.exists ? uSnap.data() || {} : {};

        const alreadySentAtMs = typeof mSnap.data()?.sentAtMs === 'number' ? mSnap.data().sentAtMs : 0;
        if (alreadySentAtMs > 0) {
          shouldSend = false;
          reason = 'already_sent';
          return;
        }

        const enabled = user?.push?.enabled === true;
        if (!enabled) {
          shouldSend = false;
          reason = 'push_not_enabled';
          return;
        }

        // If user explicitly completed application, skip.
        const completedFlag = user?.applicationComplete === true || user?.application?.complete === true;
        if (completedFlag) {
          shouldSend = false;
          reason = 'user_flag_complete';
          return;
        }

        // Mark as candidate; actual completeness is verified below (outside tx).
        shouldSend = true;
        reason = 'candidate';

        if (!dryRun) {
          tx.set(
            markerRef,
            {
              kind: 'incomplete_application_once',
              createdAt: FieldValue.serverTimestamp(),
              createdAtMs: nowMs,
              // Reserve to avoid double-sends if triggered concurrently.
              reservedAt: FieldValue.serverTimestamp(),
              reservedAtMs: nowMs,
            },
            { merge: true }
          );
        }
      });

      if (!shouldSend) {
        results.push({ uid, ok: true, skipped: true, reason });
        continue;
      }

      // Verify incompleteness with best app doc (avoid false positives).
      let app = null;
      try {
        app = await pickBestApplicationForUid({ db, uid });
      } catch {
        app = null;
      }

      // Target rule: contact number (whatsapp) missing.
      const missingContact = app ? isMissingContactNumber(app) : true;
      if (!missingContact) {
        // If we reserved in marker, update it to avoid future sends.
        if (!dryRun) {
          try {
            await markerRef.set(
              {
                kind: 'incomplete_application_once',
                skippedAt: FieldValue.serverTimestamp(),
                skippedAtMs: nowMs,
                skipReason: 'contact_number_present',
              },
              { merge: true }
            );
          } catch {
            // ignore
          }
        }
        results.push({ uid, ok: true, skipped: true, reason: 'contact_number_present' });
        continue;
      }

      if (dryRun) {
        results.push({ uid, ok: true, dryRun: true, wouldSend: true, appId: safeStr(app?.id), appSource: safeStr(app?.source) });
        continue;
      }

      let sendResult = null;
      try {
        sendResult = await sendPushToUid({
          uid,
          title,
          body: msgBody,
          url,
          type: 'campaign_incomplete_application_once',
          data: {
            campaign: 'incomplete_application_once_20260327',
            appId: safeStr(app?.id),
            appSource: safeStr(app?.source),
          },
        });
      } catch (e) {
        sendResult = { ok: false, error: safeStr(e?.message) || 'send_failed' };
      }

      try {
        await markerRef.set(
          {
            kind: 'incomplete_application_once',
            sentAt: FieldValue.serverTimestamp(),
            sentAtMs: nowMs,
            sendOk: sendResult?.ok === true,
            sendSuccessCount: typeof sendResult?.successCount === 'number' ? sendResult.successCount : 0,
            sendFailureCount: typeof sendResult?.failureCount === 'number' ? sendResult.failureCount : 0,
            sendError: safeStr(sendResult?.error),
          },
          { merge: true }
        );
      } catch {
        // ignore
      }

      results.push({
        uid,
        ok: sendResult?.ok === true,
        successCount: sendResult?.successCount || 0,
        failureCount: sendResult?.failureCount || 0,
        error: safeStr(sendResult?.error),
        appId: safeStr(app?.id),
        appSource: safeStr(app?.source),
      });
    }

    const sent = results.filter((r) => r && r.ok === true && !r.skipped && !r.dryRun).length;
    const skipped = results.filter((r) => r && r.skipped === true).length;
    const wouldSend = results.filter((r) => r && r.wouldSend === true).length;

    const lastUid = slice.length ? slice[slice.length - 1] : '';
    const nextCursorUid = lastUid && startIndex + slice.length < candidates.length ? lastUid : '';

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        dryRun,
        candidates: candidates.length,
        processed: slice.length,
        cursorUid: useCursor ? cursorUid : '',
        nextCursorUid,
        sent,
        skipped,
        wouldSend,
        results: results.slice(0, 200),
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
