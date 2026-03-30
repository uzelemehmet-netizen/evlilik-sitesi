import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function pickDoc(d) {
  const raw = d || {};
  return { id: safeStr(raw.id), ...(raw || {}) };
}

async function filterItemsByLiveSender({ db, items }) {
  const list = Array.isArray(items) ? items : [];
  const senderUids = Array.from(
    new Set(
      list
        .map((item) => safeStr(item?.fromUid))
        .filter(Boolean)
    )
  );

  if (!senderUids.length) return list;

  const liveUids = new Set();

  try {
    const refs = senderUids.map((senderUid) => db.collection('matchmakingUsers').doc(senderUid));
    let snaps = [];
    try {
      snaps = refs.length ? await db.getAll(...refs) : [];
    } catch {
      snaps = await Promise.all(refs.map((ref) => ref.get()));
    }

    for (let i = 0; i < senderUids.length; i += 1) {
      const snap = snaps[i];
      if (snap?.exists) liveUids.add(senderUids[i]);
    }
  } catch {
    // ignore
  }

  const missingUids = senderUids.filter((senderUid) => !liveUids.has(senderUid));
  if (missingUids.length) {
    for (let i = 0; i < missingUids.length; i += 10) {
      const chunk = missingUids.slice(i, i + 10);
      try {
        const snap = await db.collection('matchmakingApplications').where('userId', 'in', chunk).get();
        snap.forEach((doc) => {
          const data = doc.data() || {};
          const senderUid = safeStr(data?.userId);
          if (senderUid) liveUids.add(senderUid);
        });
      } catch {
        // ignore
      }
    }
  }

  return list.filter((item) => {
    const senderUid = safeStr(item?.fromUid);
    if (!senderUid) return true;
    return liveUids.has(senderUid);
  });
}

async function listSubcol({ db, uid, name, limitN }) {
  try {
    const snap = await db
      .collection('matchmakingUsers')
      .doc(uid)
      .collection(name)
      .orderBy('createdAtMs', 'desc')
      .limit(limitN)
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
  } catch {
    try {
      const snap2 = await db.collection('matchmakingUsers').doc(uid).collection(name).limit(limitN).get();
      return snap2.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
    } catch {
      return [];
    }
  }
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
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_authenticated' }));
      return;
    }

    const body = normalizeBody(req);
    const limitN = Math.max(1, Math.min(100, Number(body?.limit || 50) || 50));

    const { db, projectId } = getAdmin();

    const [inboxLikes, inboxAccessRequests, inboxPreMatchRequests, inboxMessages, outboxAccessRequests, outboxPreMatchRequests, outboxMessages] = await Promise.all([
      listSubcol({ db, uid, name: 'inboxLikes', limitN }),
      listSubcol({ db, uid, name: 'inboxAccessRequests', limitN }),
      listSubcol({ db, uid, name: 'inboxPreMatchRequests', limitN }),
      listSubcol({ db, uid, name: 'inboxMessages', limitN }),
      listSubcol({ db, uid, name: 'outboxAccessRequests', limitN }),
      listSubcol({ db, uid, name: 'outboxPreMatchRequests', limitN }),
      listSubcol({ db, uid, name: 'outboxMessages', limitN }),
    ]);

    const [safeInboxLikes, safeInboxAccessRequests, safeInboxPreMatchRequests] = await Promise.all([
      filterItemsByLiveSender({ db, items: inboxLikes }),
      filterItemsByLiveSender({ db, items: inboxAccessRequests }),
      filterItemsByLiveSender({ db, items: inboxPreMatchRequests }),
    ]);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        firebaseProjectId: projectId || null,
        uid,
        limit: limitN,
        inboxLikes: safeInboxLikes.map(pickDoc),
        inboxAccessRequests: safeInboxAccessRequests.map(pickDoc),
        inboxPreMatchRequests: safeInboxPreMatchRequests.map(pickDoc),
        inboxMessages: inboxMessages.map(pickDoc),
        outboxAccessRequests: outboxAccessRequests.map(pickDoc),
        outboxPreMatchRequests: outboxPreMatchRequests.map(pickDoc),
        outboxMessages: outboxMessages.map(pickDoc),
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
