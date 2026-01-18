import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function hasActiveLock(userDoc) {
  const lock = userDoc?.matchmakingLock || null;
  const active = !!lock?.active;
  const matchId = safeStr(lock?.matchId);
  return { active, matchId };
}

function getActiveChoiceMatchId(userDoc) {
  const choice = userDoc?.matchmakingChoice || null;
  const active = !!choice?.active;
  const matchId = safeStr(choice?.matchId);
  return active && matchId ? matchId : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const body = normalizeBody(req);
    const limit = typeof body?.limit === 'number' ? body.limit : 50;

    const { db, FieldValue } = getAdmin();

    const result = await db.runTransaction(async (tx) => {
      const meRef = db.collection('matchmakingUsers').doc(uid);
      const meSnap = await tx.get(meRef);
      const me = meSnap.exists ? (meSnap.data() || {}) : {};

      const myLock = hasActiveLock(me);
      if (myLock.active) {
        const err = new Error('user_locked');
        err.statusCode = 409;
        throw err;
      }

      const q = db
        .collection('matchmakingMatches')
        .where('userIds', 'array-contains', uid)
        .limit(Math.max(1, Math.min(100, limit)));

      const matchesSnap = await tx.get(q);
      const docs = matchesSnap.docs || [];

      // Karşılıklı onay / 2. adım geçmişse, bu işlemi yapmayalım (kullanıcı zaten kilitlenmiş olmalı ama ekstra guard)
      for (const d of docs) {
        const data = d.data() || {};
        const st = String(data?.status || '');
        if (st === 'mutual_accepted' || st === 'contact_unlocked') {
          const err = new Error('already_matched');
          err.statusCode = 409;
          throw err;
        }
      }

      const proposed = [];
      for (const d of docs) {
        const data = d.data() || {};
        if (String(data?.status || '') !== 'proposed') continue;

        const aUserId = safeStr(data?.aUserId);
        const bUserId = safeStr(data?.bUserId);
        if (uid !== aUserId && uid !== bUserId) continue;

        proposed.push({ ref: d.ref, id: d.id, data, aUserId, bUserId });
      }

      if (proposed.length === 0) {
        tx.set(
          meRef,
          {
            matchmakingChoice: { active: false, matchId: '' },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return { cancelledCount: 0 };
      }

      // Diğer kullanıcı dokümanlarını tek seferde oku (choice/lock temizlemek için)
      const otherUserIds = new Set();
      for (const m of proposed) {
        const other = uid === m.aUserId ? m.bUserId : m.aUserId;
        if (other) otherUserIds.add(other);
      }

      const otherRefs = Array.from(otherUserIds).map((id) => ({ id, ref: db.collection('matchmakingUsers').doc(id) }));
      const otherSnaps = await Promise.all(otherRefs.map((x) => tx.get(x.ref)));
      const otherById = {};
      otherRefs.forEach((x, i) => {
        otherById[x.id] = otherSnaps[i]?.exists ? (otherSnaps[i].data() || {}) : {};
      });

      let cancelledCount = 0;

      for (const m of proposed) {
        const data = m.data || {};
        const aUserId = m.aUserId;
        const bUserId = m.bUserId;
        const side = uid === aUserId ? 'a' : 'b';

        const decisions = {
          a: data?.decisions?.a ?? null,
          b: data?.decisions?.b ?? null,
        };

        decisions[side] = 'reject';

        tx.set(
          m.ref,
          {
            decisions,
            status: 'cancelled',
            cancelledAt: FieldValue.serverTimestamp(),
            cancelledByUserId: uid,
            cancelledReason: 'rejected_all',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const otherUserId = uid === aUserId ? bUserId : aUserId;
        if (otherUserId) {
          const otherDoc = otherById[otherUserId] || {};
          const otherChoice = getActiveChoiceMatchId(otherDoc);
          const otherLock = hasActiveLock(otherDoc);

          const patch = { updatedAt: FieldValue.serverTimestamp() };

          if (otherChoice === m.id) {
            patch.matchmakingChoice = { active: false, matchId: '' };
          }
          if (otherLock.active && otherLock.matchId === m.id) {
            patch.matchmakingLock = { active: false, matchId: '' };
          }

          if (patch.matchmakingChoice || patch.matchmakingLock) {
            const otherRef = db.collection('matchmakingUsers').doc(otherUserId);
            tx.set(otherRef, patch, { merge: true });
          }
        }

        cancelledCount += 1;
      }

      // Benim seçim/lock alanlarımı da temizle
      tx.set(
        meRef,
        {
          matchmakingChoice: { active: false, matchId: '' },
          matchmakingLock: { active: false, matchId: '' },
          matchmakingRejectedAllAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { cancelledCount };
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, cancelledCount: result?.cancelledCount || 0 }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
