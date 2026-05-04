import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { normalizeDoc, safeStr } from './_adminUi.js';

function normalizeRequirementList(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item, index) => ({
      id: safeStr(item?.id) || `req_${Date.now()}_${index}`,
      text: safeStr(item?.text),
      description: safeStr(item?.description),
    }))
    .filter((item) => item.text || item.description);
}

function buildOfficePayload(source) {
  const officeName = safeStr(source?.officeName);
  return {
    officeName,
    officeNameLower: officeName.toLocaleLowerCase('tr-TR'),
    address: safeStr(source?.address),
    phone: safeStr(source?.phone),
    maleRequirements: normalizeRequirementList(source?.maleRequirements),
    femaleRequirements: normalizeRequirementList(source?.femaleRequirements),
    documentImageUrl: safeStr(source?.documentImageUrl),
    documentImagePublicId: safeStr(source?.documentImagePublicId),
    documentImageCaption: safeStr(source?.documentImageCaption),
  };
}

export default async function adminKuaOffices(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const admin = await requireAdmin(req);
    const body = normalizeBody(req);
    const action = safeStr(body?.action).toLowerCase() || 'list';
    const { db, FieldValue } = getAdmin();

    if (action === 'list') {
      const snap = await db.collection('adminKuaOffices').orderBy('officeNameLower').get();
      const offices = snap.docs.map((doc) => normalizeDoc(doc.id, doc.data() || {}));
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, offices }));
      return;
    }

    if (action === 'create') {
      const payload = buildOfficePayload(body?.office || body);
      if (!payload.officeName) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'office_name_required' }));
        return;
      }

      const ref = await db.collection('adminKuaOffices').add({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdByUid: safeStr(admin?.uid),
        createdByEmail: safeStr(admin?.email),
      });
      const snap = await ref.get();

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, office: normalizeDoc(ref.id, snap.data() || payload) }));
      return;
    }

    if (action === 'update') {
      const officeId = safeStr(body?.officeId || body?.id || body?.office?.id);
      const payload = buildOfficePayload(body?.office || body);
      if (!officeId || !payload.officeName) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
        return;
      }

      const ref = db.collection('adminKuaOffices').doc(officeId);
      await ref.set(
        {
          ...payload,
          updatedAt: FieldValue.serverTimestamp(),
          updatedByUid: safeStr(admin?.uid),
          updatedByEmail: safeStr(admin?.email),
        },
        { merge: true }
      );
      const snap = await ref.get();

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, office: normalizeDoc(officeId, snap.data() || payload) }));
      return;
    }

    if (action === 'delete') {
      const officeId = safeStr(body?.officeId || body?.id);
      if (!officeId) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
        return;
      }

      await db.collection('adminKuaOffices').doc(officeId).delete();
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, deleted: true, officeId }));
      return;
    }

    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unknown_action' }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}