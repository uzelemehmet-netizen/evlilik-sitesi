import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeInt(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function normalizeKeysEnv(raw) {
  const s = safeStr(raw);
  if (!s) return [];
  return s
    .split(/[\s,;]+/)
    .map((x) => safeStr(x))
    .filter(Boolean)
    .slice(0, 20);
}

function isKeyAllowed(googleKey) {
  const keys = normalizeKeysEnv(process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEYS || process.env.GOOGLE_ADS_LEADFORM_KEYS);
  if (!keys.length) return false;
  return keys.includes(safeStr(googleKey));
}

function extractFields(userColumnData) {
  const fields = {};
  const arr = Array.isArray(userColumnData) ? userColumnData : [];
  for (const row of arr) {
    const id = safeStr(row?.column_id) || safeStr(row?.columnId);
    const val = safeStr(row?.string_value ?? row?.stringValue ?? '');
    if (!id || !val) continue;
    fields[id] = val;
  }
  return fields;
}

function buildNormalizedLead(body) {
  const leadId = safeStr(body?.lead_id || body?.leadId);
  const googleKey = safeStr(body?.google_key || body?.googleKey || body?.Google_key);

  const normalized = {
    source: 'google_ads_lead_form',
    lead_id: leadId,
    api_version: safeStr(body?.api_version || body?.apiVersion) || null,
    form_id: safeInt(body?.form_id || body?.formId) || null,
    campaign_id: safeInt(body?.campaign_id || body?.campaignId) || null,
    adgroup_id: safeInt(body?.adgroup_id || body?.adgroupId) || null,
    creative_id: safeInt(body?.creative_id || body?.creativeId) || null,
    asset_group_id: safeInt(body?.asset_group_id || body?.assetGroupId) || null,
    google_key: googleKey || null,
    gcl_id: safeStr(body?.gcl_id || body?.gclId) || null,
    is_test: body?.is_test === true || String(body?.is_test || '').toLowerCase() === 'true',
    lead_stage: safeStr(body?.lead_stage || body?.leadStage) || null,
    lead_submit_time: safeStr(body?.lead_submit_time || body?.leadSubmitTime) || null,
    fields: extractFields(body?.user_column_data || body?.userColumnData),
  };

  return normalized;
}

async function forwardToCdmCrm(normalizedLead) {
  const url = safeStr(process.env.CDM_CRM_WEBHOOK_URL);
  if (!url) return { skipped: true };

  const secret = safeStr(process.env.CDM_CRM_WEBHOOK_SECRET);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret ? { 'x-cdm-crm-secret': secret } : {}),
    },
    body: JSON.stringify(normalizedLead),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    const err = new Error(`cdm_crm_forward_failed_http_${res.status}`);
    err.statusCode = 502;
    err.details = { status: res.status, body: String(text || '').slice(0, 2000) };
    throw err;
  }

  return { ok: true, status: res.status, body: String(text || '').slice(0, 1000) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const nowMs = Date.now();

  try {
    const body = normalizeBody(req);
    const normalizedLead = buildNormalizedLead(body);

    if (!normalizedLead.lead_id) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request_missing_lead_id' }));
      return;
    }

    // Google Lead Form webhook doğrulaması: payload içindeki google_key, formda ayarlanan anahtar.
    // Bu anahtar yoksa ya da bizde env’de tanımlı değilse isteği reddet.
    if (!isKeyAllowed(normalizedLead.google_key)) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'forbidden_bad_google_key' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('googleAdsLeadForms').doc(normalizedLead.lead_id);

    let shouldDeliver = true;
    let wasDuplicate = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        const prev = snap.data() || {};
        const delivered = prev?.delivered === true;
        wasDuplicate = true;
        shouldDeliver = !delivered;
        tx.set(
          ref,
          {
            lastReceivedAt: FieldValue.serverTimestamp(),
            lastReceivedAtMs: nowMs,
            duplicateCount: FieldValue.increment(1),
          },
          { merge: true }
        );
        return;
      }

      wasDuplicate = false;
      shouldDeliver = true;
      tx.set(
        ref,
        {
          leadId: normalizedLead.lead_id,
          receivedAt: FieldValue.serverTimestamp(),
          receivedAtMs: nowMs,
          delivered: false,
          deliverAttempts: 0,
          isTest: normalizedLead.is_test === true,
          formId: normalizedLead.form_id || null,
          campaignId: normalizedLead.campaign_id || null,
          gclId: normalizedLead.gcl_id || null,
          leadSubmitTime: normalizedLead.lead_submit_time || null,
          fields: normalizedLead.fields || {},
          raw: body || {},
        },
        { merge: false }
      );
    });

    let forwardResult = null;

    if (shouldDeliver) {
      await ref.set(
        {
          deliverAttempts: FieldValue.increment(1),
          lastDeliverAttemptAt: FieldValue.serverTimestamp(),
          lastDeliverAttemptAtMs: nowMs,
        },
        { merge: true }
      );

      forwardResult = await forwardToCdmCrm(normalizedLead);

      await ref.set(
        {
          delivered: true,
          deliveredAt: FieldValue.serverTimestamp(),
          deliveredAtMs: Date.now(),
          lastDeliveryStatus: forwardResult?.status || 200,
        },
        { merge: true }
      );
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: true, leadId: normalizedLead.lead_id, duplicate: wasDuplicate, delivered: !!shouldDeliver }));
  } catch (e) {
    // 5XX -> Google retry; 4XX -> no retry (bu yüzden burada 5XX kullanıyoruz)
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
