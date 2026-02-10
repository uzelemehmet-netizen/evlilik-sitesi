import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureMembershipActiveOrThrow, ensureProfileCompleteOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function containsContactLikeText(text) {
  const s = String(text || '').toLowerCase();

  if (/https?:\/\//i.test(s) || /www\./i.test(s) || /\b[a-z0-9-]+\.(com|net|org|id|tr|me)\b/i.test(s)) return true;
  if (/(instagram|insta|\big\b|facebook|\bfb\b|telegram|\bt\.me\b|whatsapp|\bwa\.me\b|line\b|tiktok|discord)/i.test(s)) return true;
  if (/@[a-z0-9_\.]{2,}/i.test(s)) return true;

  const digitsOnly = s.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 8) {
    if (/\+\s*\d{8,}/.test(s)) return true;
    if (digitsOnly.length >= 10) return true;
    if (/(\d[\s\-\.\(\)]*){8,}/.test(s)) return true;
  }

  return false;
}

function buildFromProfileFromMatchProfile(p) {
  const obj = p && typeof p === 'object' ? p : {};
  const username = safeStr(obj?.username);
  const age = typeof obj?.age === 'number' && Number.isFinite(obj.age) ? obj.age : null;
  const city = safeStr(obj?.city);
  const photoUrls = Array.isArray(obj?.photoUrls) ? obj.photoUrls : [];
  const photoUrl = safeStr(photoUrls.find((x) => safeStr(x)) || '');

  return {
    username,
    age,
    city,
    photoUrl,
  };
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid);

    const body = normalizeBody(req);
    const matchId = safeStr(body?.matchId);
    const messageTextRaw = safeStr(body?.messageText);
    const messageText = messageTextRaw ? messageTextRaw.slice(0, 260) : '';

    if (!uid || !matchId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    if (messageText && messageText.length > 240) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'short_message_too_long' }));
      return;
    }

    if (messageText && containsContactLikeText(messageText)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'filtered' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    // Etkileşim kuralı: fotoğraf izni istemek bir aksiyon sayılır.
    try {
      const meUserSnap = await db.collection('matchmakingUsers').doc(uid).get();
      const meUser = meUserSnap.exists ? meUserSnap.data() || {} : {};
      await ensureProfileCompleteOrThrow(db, uid);
      ensureMembershipActiveOrThrow(meUser);
    } catch (e2) {
      res.statusCode = e2?.statusCode || 402;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: String(e2?.message || 'membership_required') }));
      return;
    }

    const matchRef = db.collection('matchmakingMatches').doc(matchId);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'match_not_found' }));
      return;
    }

    const match = matchSnap.data() || {};
    const aUserId = safeStr(match?.aUserId);
    const bUserId = safeStr(match?.bUserId);

    const mySide = uid && aUserId === uid ? 'a' : uid && bUserId === uid ? 'b' : '';
    if (!mySide) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'forbidden' }));
      return;
    }

    const otherUid = mySide === 'a' ? bUserId : aUserId;
    if (!otherUid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    // Zaten izin verilmişse idempotent şekilde dön.
    const photoAccess = match?.photoAccess && typeof match.photoAccess === 'object' ? match.photoAccess : {};
    const alreadyGranted = mySide === 'a' ? !!photoAccess?.bToA : !!photoAccess?.aToB;
    if (alreadyGranted) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'granted' }));
      return;
    }

    const now = Date.now();
    const requestId = `${uid}__${otherUid}`;

    const inboxRef = db.collection('matchmakingUsers').doc(otherUid).collection('inboxAccessRequests').doc(requestId);
    const outboxRef = db.collection('matchmakingUsers').doc(uid).collection('outboxAccessRequests').doc(requestId);

    const profiles = match?.profiles && typeof match.profiles === 'object' ? match.profiles : {};
    const myProfileSnap = profiles?.[mySide] && typeof profiles[mySide] === 'object' ? profiles[mySide] : null;
    const fromProfile = buildFromProfileFromMatchProfile(myProfileSnap);

    let status = 'pending';

    await db.runTransaction(async (tx) => {
      const outSnap = await tx.get(outboxRef);
      if (outSnap.exists) {
        const cur = outSnap.data() || {};
        const curType = safeStr(cur?.type);
        const curStatus = safeStr(cur?.status);

        // Eğer eski tip (profile_access vb.) doc varsa üstüne yazmayalım.
        if (curType && curType !== 'photo_access') {
          status = curStatus || 'pending';
          return;
        }

        if (curStatus === 'approved') {
          status = 'approved';
          return;
        }
        if (curStatus === 'pending') {
          status = 'pending';

          const curMsg = safeStr(cur?.messageText);
          const patch = {
            type: 'photo_access',
            fromUid: uid,
            toUid: otherUid,
            fromProfile,
            matchId,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: now,
          };

          if (messageText && !curMsg) {
            patch.messageText = messageText;
            patch.messageCreatedAt = FieldValue.serverTimestamp();
            patch.messageCreatedAtMs = now;
            patch.messageReadAtMs = 0;
          }

          tx.set(inboxRef, patch, { merge: true });
          tx.set(outboxRef, patch, { merge: true });
          return;
        }
        // rejected/unknown => yeniden pending'e çek.
      }

      const payload = {
        type: 'photo_access',
        status: 'pending',
        fromUid: uid,
        toUid: otherUid,
        fromProfile,
        matchId,
        requestId,
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: now,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: now,
        ...(messageText
          ? {
              messageText,
              messageCreatedAt: FieldValue.serverTimestamp(),
              messageCreatedAtMs: now,
              messageReadAtMs: 0,
            }
          : {}),
      };

      tx.set(inboxRef, payload, { merge: true });
      tx.set(outboxRef, payload, { merge: true });
      status = 'pending';
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, requestId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
