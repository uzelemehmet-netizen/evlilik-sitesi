import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function pickDoc(d) {
  const raw = d || {};
  return { id: safeStr(raw.id), ...(raw || {}) };
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

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        firebaseProjectId: projectId || null,
        uid,
        limit: limitN,
        inboxLikes: inboxLikes.map(pickDoc),
        inboxAccessRequests: inboxAccessRequests.map(pickDoc),
        inboxPreMatchRequests: inboxPreMatchRequests.map(pickDoc),
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
