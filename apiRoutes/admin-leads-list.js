import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeBool(v) {
  if (v === true || v === false) return v;
  const s = safeStr(v).toLowerCase();
  if (!s) return null;
  if (s === '1' || s === 'true' || s === 'yes' || s === 'evet') return true;
  if (s === '0' || s === 'false' || s === 'no' || s === 'hayir' || s === 'hayır') return false;
  return null;
}

function normalizeFamilyApproval(v) {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  const s = safeStr(v).toLowerCase();
  if (!s) return '';
  if (s === '1' || s === 'true' || s === 'yes' || s === 'evet') return 'yes';
  if (s === '0' || s === 'false' || s === 'no' || s === 'hayir' || s === 'hayır') return 'no';
  if (s === 'unknown' || s === 'not_yet' || s === 'notyet' || s === 'pending') return 'unknown';
  return '';
}

function normalizeStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => safeStr(x)).filter(Boolean);
  const s = safeStr(v);
  if (!s) return [];
  // Support legacy comma/semicolon separated storage.
  return s
    .split(/[,;\n\t]+/g)
    .map((x) => safeStr(x))
    .filter(Boolean);
}

function normalizeUrlArray(v, { max = 5 } = {}) {
  const arr = Array.isArray(v) ? v : [];
  return arr.map((x) => safeStr(x)).filter(Boolean).slice(0, max);
}

function normalizeIdArray(v, { max = 5 } = {}) {
  const arr = Array.isArray(v) ? v : [];
  return arr.map((x) => safeStr(x)).filter(Boolean).slice(0, max);
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'female') return 'female';
  if (s === 'male') return 'male';
  return '';
}

function normalizeSourceKind(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'manual' || s === 'whatsapp') return 'manual';
  if (s === 'form' || s === 'application') return 'form';
  return 'all';
}

export default async function adminLeadsList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);

    const gender = normalizeGender(body?.gender);
    const status = safeStr(body?.status);
    const sourceKind = normalizeSourceKind(body?.sourceKind);
    const limit = typeof body?.limit === 'number' && Number.isFinite(body.limit) ? Math.max(1, Math.min(100, Math.floor(body.limit))) : 50;

    const { db } = getAdmin();

    let q = db.collection('matchmakingLeads');
    if (gender) q = q.where('lead.gender', '==', gender);

    const needsPostFilterExpansion = sourceKind !== 'all' || !!status;
    const queryLimit = needsPostFilterExpansion
      ? Math.min(250, Math.max(limit * 4, 100))
      : (sourceKind === 'form' ? Math.min(250, Math.max(limit, limit * 4)) : limit);
    q = q.orderBy('createdAtMs', 'desc').limit(queryLimit);

    const snap = await q.get();

    const items = snap.docs.map((d) => {
      const data = d.data() || {};
      const lead = data?.lead && typeof data.lead === 'object' ? data.lead : {};
      const familyApproval = normalizeFamilyApproval(lead?.familyApproval);
      const photoUrls = normalizeUrlArray(lead?.photoUrls);
      const photoPublicIds = normalizeIdArray(lead?.photoPublicIds);
      const legacyPhotoUrl = safeStr(lead?.photoUrl);
      const legacyPhotoPublicId = safeStr(lead?.photoPublicId);
      const finalPhotoUrls = photoUrls.length ? photoUrls : (legacyPhotoUrl ? [legacyPhotoUrl] : []);
      const finalPhotoPublicIds = photoPublicIds.length ? photoPublicIds : (legacyPhotoPublicId ? [legacyPhotoPublicId] : []);
      return {
        id: d.id,
        status: safeStr(data?.status) || 'new',
        source: safeStr(data?.source),
        sourceKind: safeStr(data?.source) === 'admin_manual_mediation' ? 'manual' : 'form',
        createdAtMs: typeof data?.createdAtMs === 'number' ? data.createdAtMs : 0,
        updatedAtMs: typeof data?.updatedAtMs === 'number' ? data.updatedAtMs : 0,
        lead: {
          gender: safeStr(lead?.gender),
          fullName: safeStr(lead?.fullName),
          age: typeof lead?.age === 'number' ? lead.age : null,
          city: safeStr(lead?.city),
          plannedLivingCountry: safeStr(lead?.plannedLivingCountry),
          whatsapp: safeStr(lead?.whatsapp),
          maritalStatus: safeStr(lead?.maritalStatus),
          religion: safeStr(lead?.religion),
          hasChildren: safeStr(lead?.hasChildren),
          childrenCount: safeStr(lead?.childrenCount),
          childrenAges: safeStr(lead?.childrenAges),
          childrenLivingWith: safeStr(lead?.childrenLivingWith),
          liveWithChildrenAfterMarriage: safeStr(lead?.liveWithChildrenAfterMarriage),
          livingWith: safeStr(lead?.livingWith),
          occupation: safeStr(lead?.occupation),
          profession: safeStr(lead?.profession),
          income: safeStr(lead?.income),
          foreignLanguage: safeStr(lead?.foreignLanguage),
          translationOk: typeof lead?.translationOk === 'boolean' ? lead.translationOk : null,
          familyApproval: familyApproval,
          additionalInfoStatus: safeStr(lead?.additionalInfoStatus),
          additionalInfoText: safeStr(lead?.additionalInfoText),
          religiousValues: normalizeStringArray(lead?.religiousValues),
          religiousPractices: normalizeStringArray(
            lead?.religiousPractices ?? lead?.religiousDuties ?? lead?.diniGorevler ?? lead?.dini_gorevler
          ),
          photoUrl: finalPhotoUrls[0] || '',
          photoPublicId: finalPhotoPublicIds[0] || '',
          photoUrls: finalPhotoUrls,
          photoPublicIds: finalPhotoPublicIds,
        },
        partner: data?.partner || {},
        admin: data?.admin || {},
      };
    }).filter((item) => {
      if (status && item.status !== status) return false;
      if (sourceKind === 'all') return true;
      if (sourceKind === 'manual') return item.sourceKind === 'manual';
      return item.sourceKind === 'form';
    }).slice(0, limit);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, items }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
