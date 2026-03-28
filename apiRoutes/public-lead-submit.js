import crypto from 'node:crypto';
import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function truncate(s, maxLen) {
  const t = safeStr(s);
  if (!t) return '';
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

function safeInt(v, { min = null, max = null } = {}) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (typeof min === 'number' && i < min) return null;
  if (typeof max === 'number' && i > max) return null;
  return i;
}

function safeBool(v) {
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'yes';
}

function normalizeUrlArray(v, { max = 5 } = {}) {
  const arr = Array.isArray(v) ? v : [];
  return arr
    .map((x) => truncate(x, 800))
    .filter(Boolean)
    .slice(0, max);
}

function normalizeIdArray(v, { max = 5 } = {}) {
  const arr = Array.isArray(v) ? v : [];
  return arr
    .map((x) => truncate(x, 200))
    .filter(Boolean)
    .slice(0, max);
}

function normalizeFamilyApproval(v) {
  // Accept historical booleans and new tri-state strings.
  if (v === true) return 'yes';
  if (v === false) return 'no';
  const s = safeStr(v).toLowerCase();
  if (!s) return '';
  if (s === 'yes' || s === 'true' || s === '1' || s === 'evet') return 'yes';
  if (s === 'no' || s === 'false' || s === '0' || s === 'hayir' || s === 'hayır') return 'no';
  if (s === 'unknown' || s === 'not_yet' || s === 'notyet' || s === 'pending') return 'unknown';
  return '';
}

function sha256Short(input) {
  try {
    const h = crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex');
    return h.slice(0, 16);
  } catch {
    return '';
  }
}

function dayKeyTRFromMs(ms) {
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function pickServerMeta(req) {
  try {
    const h = (req && req.headers) || {};
    const ua = truncate(safeStr(h['user-agent'] || h['User-Agent'] || ''), 320) || null;
    const acceptLanguage = truncate(safeStr(h['accept-language'] || h['Accept-Language'] || ''), 240) || null;
    const country = truncate(safeStr(h['x-vercel-ip-country'] || h['cf-ipcountry'] || ''), 8) || null;
    const region = truncate(safeStr(h['x-vercel-ip-country-region'] || ''), 80) || null;
    const city = truncate(safeStr(h['x-vercel-ip-city'] || ''), 80) || null;
    const out = { ua, acceptLanguage, country, region, city };
    for (const k of Object.keys(out)) if (!out[k]) delete out[k];
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'female' || s === 'kadin' || s === 'kadın' || s === 'woman') return 'female';
  if (s === 'male' || s === 'erkek' || s === 'man') return 'male';
  return '';
}

export default async function publicLeadSubmit(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const body = normalizeBody(req);

    const consentAccuracy = safeBool(body?.consentAccuracy);
    const consentDisclaimer = safeBool(body?.consentDisclaimer);
    if (!consentAccuracy || !consentDisclaimer) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'consents_required' }));
      return;
    }

    const lead = body?.lead && typeof body.lead === 'object' ? body.lead : {};
    const partner = body?.partner && typeof body.partner === 'object' ? body.partner : {};

    const gender = normalizeGender(lead?.gender);
    const fullName = truncate(lead?.fullName, 120);
    const age = safeInt(lead?.age, { min: 18, max: 99 });
    const city = truncate(lead?.city, 80);
    const whatsapp = truncate(lead?.whatsapp, 60);
    const maritalStatus = truncate(lead?.maritalStatus, 40);
    const hasChildren = truncate(lead?.hasChildren, 40);
    const childrenCount = truncate(lead?.childrenCount, 40);
    const childrenAges = truncate(lead?.childrenAges, 240);
    const childrenLivingWith = truncate(lead?.childrenLivingWith, 120);
    const livingWith = truncate(lead?.livingWith, 80);
    const occupation = truncate(lead?.occupation, 120);
    const profession = truncate(lead?.profession, 120);
    const income = truncate(lead?.income, 40);
    const foreignLanguage = truncate(lead?.foreignLanguage, 80);
    const translationOk = safeBool(lead?.translationOk);
    const familyApproval = normalizeFamilyApproval(lead?.familyApproval);
    const additionalInfoStatus = truncate(lead?.additionalInfoStatus, 20);
    const additionalInfoTextRaw = truncate(lead?.additionalInfoText, 1200);
    const additionalInfoText = additionalInfoStatus === 'yes' ? additionalInfoTextRaw : '';

    const religiousPractices = Array.isArray(lead?.religiousPractices) ? lead.religiousPractices.map((x) => truncate(x, 80)).filter(Boolean) : [];
    const religiousValues = Array.isArray(lead?.religiousValues) ? lead.religiousValues.map((x) => truncate(x, 80)).filter(Boolean) : [];

    const photoUrls = normalizeUrlArray(lead?.photoUrls);
    const photoPublicIds = normalizeIdArray(lead?.photoPublicIds);

    const legacyPhotoUrl = truncate(lead?.photoUrl, 800);
    const legacyPhotoPublicId = truncate(lead?.photoPublicId, 200);

    const finalPhotoUrls = (photoUrls.length ? photoUrls : (legacyPhotoUrl ? [legacyPhotoUrl] : [])).slice(0, 5);
    const finalPhotoPublicIds = (photoPublicIds.length ? photoPublicIds : (legacyPhotoPublicId ? [legacyPhotoPublicId] : [])).slice(0, 5);

    const photoUrl = finalPhotoUrls[0] || '';
    const photoPublicId = finalPhotoPublicIds[0] || '';

    const partnerAgeMin = safeInt(partner?.ageMin, { min: 18, max: 99 });
    const partnerAgeMax = safeInt(partner?.ageMax, { min: 18, max: 99 });
    const partnerHeightMinCm = safeInt(partner?.heightMinCm, { min: 120, max: 230 });
    const partnerHeightMaxCm = safeInt(partner?.heightMaxCm, { min: 120, max: 230 });
    const partnerWeightMinKg = safeInt(partner?.weightMinKg, { min: 35, max: 250 });
    const partnerWeightMaxKg = safeInt(partner?.weightMaxKg, { min: 35, max: 250 });
    const partnerOccupation = truncate(partner?.occupation, 120);
    const partnerSpouseWanted = truncate(partner?.spouseWanted, 1200);
    const partnerIncome = truncate(partner?.income, 40);
    const partnerLivingWith = truncate(partner?.livingWith, 80);
    const partnerReligiousValues = truncate(partner?.religiousValues, 240);
    const partnerMaritalStatus = truncate(partner?.maritalStatus, 40);
    const partnerHasChildren = truncate(partner?.hasChildren, 40);

    if (!gender) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'gender_required' }));
      return;
    }

    if (!fullName) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'fullName_required' }));
      return;
    }

    if (!(typeof age === 'number')) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'age_required' }));
      return;
    }

    if (!city) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'city_required' }));
      return;
    }

    if (!whatsapp) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'whatsapp_required' }));
      return;
    }

    if (!finalPhotoUrls.length) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'photo_required' }));
      return;
    }

    if (partnerAgeMin !== null && partnerAgeMax !== null && partnerAgeMin > partnerAgeMax) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'partner_age_range_invalid' }));
      return;
    }
    if (partnerHeightMinCm !== null && partnerHeightMaxCm !== null && partnerHeightMinCm > partnerHeightMaxCm) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'partner_height_range_invalid' }));
      return;
    }
    if (partnerWeightMinKg !== null && partnerWeightMaxKg !== null && partnerWeightMinKg > partnerWeightMaxKg) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'partner_weight_range_invalid' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const nowMs = Date.now();

    // Basic rate limit / dedupe per WhatsApp per day.
    const dayKey = dayKeyTRFromMs(nowMs);
    const fp = sha256Short(`${dayKey}|${whatsapp}`);
    const dedupeRef = db.collection('publicLeadDedupe').doc(`${dayKey}__${fp || 'nofp'}`);
    const leadRef = db.collection('matchmakingLeads').doc();

    await db.runTransaction(async (tx) => {
      const d = await tx.get(dedupeRef);
      if (d.exists) {
        const err = new Error('rate_limited');
        err.statusCode = 429;
        throw err;
      }

      tx.set(dedupeRef, {
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: nowMs,
        whatsappHash: fp || null,
      });

      tx.set(leadRef, {
        kind: 'matchmaking_lead',
        status: 'new',
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: nowMs,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,

        consentAccuracy: true,
        consentDisclaimer: true,

        lead: {
          gender,
          fullName,
          age,
          city,
          whatsapp,
          maritalStatus,
          hasChildren,
          childrenCount: hasChildren === 'yes' ? childrenCount : '',
          childrenAges: hasChildren === 'yes' ? childrenAges : '',
          childrenLivingWith: hasChildren === 'yes' ? childrenLivingWith : '',
          livingWith,
          occupation,
          profession,
          income,
          foreignLanguage,
          translationOk,
          familyApproval,
          additionalInfoStatus,
          additionalInfoText,
          religiousPractices,
          religiousValues,
          photoUrl,
          photoPublicId,
          photoUrls: finalPhotoUrls,
          photoPublicIds: finalPhotoPublicIds,
        },

        partner: {
          ageMin: partnerAgeMin,
          ageMax: partnerAgeMax,
          heightMinCm: partnerHeightMinCm,
          heightMaxCm: partnerHeightMaxCm,
          weightMinKg: partnerWeightMinKg,
          weightMaxKg: partnerWeightMaxKg,
          occupation: partnerOccupation,
          spouseWanted: partnerSpouseWanted,
          income: partnerIncome,
          livingWith: partnerLivingWith,
          religiousValues: partnerReligiousValues,
          maritalStatus: partnerMaritalStatus,
          hasChildren: partnerHasChildren,
        },

        admin: {
          notes: '',
          contacted: false,
          contactedAtMs: 0,
        },

        meta: {
          server: pickServerMeta(req),
        },
      });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, id: leadRef.id }));
  } catch (e) {
    const code = String(e?.message || 'server_error');
    res.statusCode = e?.statusCode || (code === 'rate_limited' ? 429 : 500);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: code }));
  }
}
