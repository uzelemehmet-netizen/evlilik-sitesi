import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function safeInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function pathFromUrl(raw) {
  const s = safeStr(raw);
  if (!s) return '';
  try {
    return safeStr(new URL(s).pathname || '');
  } catch {
    return '';
  }
}

function pagePathOf(item) {
  const report = safeObj(item?.data?.report) || {};
  const extra = safeObj(item?.data?.extra) || {};
  return (
    safeStr(item?.pagePath) ||
    safeStr(extra?.path) ||
    pathFromUrl(report?.page) ||
    ''
  );
}

function isPublicFunnelPath(pathRaw) {
  const path = safeStr(pathRaw).toLowerCase();
  if (!path) return false;
  if (path.startsWith('/admin')) return false;
  if (path.startsWith('/studio')) return false;
  if (path.startsWith('/api')) return false;
  return true;
}

function lowerJoined(parts) {
  return parts.filter(Boolean).map((v) => safeStr(v).toLowerCase()).join(' | ');
}

function isKnownLowSignalNoise(item) {
  const report = safeObj(item?.data?.report) || {};
  const extra = safeObj(item?.data?.extra) || {};
  const code = safeStr(report?.code).toLowerCase();
  const kind = safeStr(report?.kind || item?.step?.replace(/^auto_error:/, '')).toLowerCase();
  const inAppBrowserHint = safeStr(extra?.inAppBrowserHint).toLowerCase();
  const visibility = safeStr(extra?.visibility).toLowerCase();
  const message = lowerJoined([
    item?.message,
    item?.text,
    report?.message,
    extra?.errorMessage,
    item?.data?.error?.stack,
  ]);
  const blockedHint = lowerJoined([extra?.blockedUrlHint, extra?.blockedHost]);
  const resourceHint = lowerJoined([extra?.resourceUrlHint, extra?.resourceHost, extra?.filenameHint]);

  if (message.includes('java object is gone') && /error invoking enable[a-z]+logging/.test(message)) {
    if ((inAppBrowserHint === 'facebook' || inAppBrowserHint === 'instagram') && (!visibility || visibility === 'hidden')) {
      return true;
    }
  }

  if (kind === 'csp_violation') {
    if (blockedHint.includes('translate.googleapis.com/element/log')) return true;
    if (blockedHint.includes('www.google.com/rmkt/collect')) return true;
  }

  if (code === '3p_resource_load_error_analytics') return true;
  if (code === 'resource_load_error') {
    if (resourceHint.includes('googletagmanager.com/gtag/js')) return true;
    if (resourceHint.includes('analytics.tiktok.com/i18n/pixel/events.js')) return true;
    if (resourceHint.includes('googleads.g.doubleclick.net/pagead/')) return true;
    if (resourceHint.includes('www.googleadservices.com/pagead/')) return true;
  }

  if (code === 'script_error_no_details' && inAppBrowserHint) return true;

  return false;
}

function hasHighRiskAuthSignal(item) {
  const report = safeObj(item?.data?.report) || {};
  const extra = safeObj(item?.data?.extra) || {};
  const authClass = safeStr(extra?.authClass).toLowerCase();
  const authProvider = safeStr(extra?.authProvider).toLowerCase();
  const authTransport = safeStr(extra?.authTransport).toLowerCase();
  const joined = lowerJoined([item?.message, item?.text, report?.message, extra?.errorMessage]);

  const actionableAuthClasses = new Set([
    'unauthorized_domain',
    'popup_blocked',
    'operation_not_allowed',
    'invalid_api_key',
    'configuration_not_found',
    'network_request_failed',
    'network_or_timeout',
    'csp_blocked',
  ]);

  if (actionableAuthClasses.has(authClass)) return true;
  if (safeStr(report?.kind).toLowerCase() === 'auth_issue' && actionableAuthClasses.has(authClass)) return true;

  if (authProvider === 'google' || authTransport === 'popup' || authTransport === 'redirect') {
    if (/content security policy|csp|popup blocked|unauthorized-domain|configuration-not-found|invalid-api-key|network-request-failed|failed to fetch|timeout/.test(joined)) {
      return true;
    }
  }

  return false;
}

function hasActionableCspSignal(item) {
  const report = safeObj(item?.data?.report) || {};
  const extra = safeObj(item?.data?.extra) || {};
  const kind = safeStr(report?.kind || item?.step?.replace(/^auto_error:/, '')).toLowerCase();
  if (kind !== 'csp_violation') return false;

  const directive = safeStr(extra?.directive).toLowerCase();
  const blockedHint = lowerJoined([extra?.blockedUrlHint, extra?.blockedHost, report?.message]);

  if (!directive && !blockedHint) return false;
  if (blockedHint.includes('translate.googleapis.com/element/log')) return false;
  if (blockedHint.includes('www.google.com/rmkt/collect')) return false;

  if (/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|apis\.google\.com|accounts\.google\.com/.test(blockedHint)) {
    return true;
  }

  return new Set(['connect-src', 'script-src', 'script-src-elem', 'frame-src', 'worker-src', 'child-src']).has(directive);
}

function hasFirstPartyRuntimeBreak(item) {
  const report = safeObj(item?.data?.report) || {};
  const extra = safeObj(item?.data?.extra) || {};
  const code = safeStr(report?.code).toLowerCase();
  const filenameHint = safeStr(extra?.filenameHint).toLowerCase();
  const resourceHint = safeStr(extra?.resourceUrlHint || extra?.resourceHost).toLowerCase();
  const stackHints = Array.isArray(extra?.stackUrlHints) ? extra.stackUrlHints.map((x) => safeStr(x).toLowerCase()) : [];

  const isFirstPartyHint = (value) => value.includes('uniqah.com/assets/') || value.includes('uniqah.com/login');

  if (code === 'resource_load_error' && isFirstPartyHint(resourceHint)) return true;
  if (code === 'unhandled_error' && isFirstPartyHint(filenameHint)) return true;
  if (code === 'unhandled_error' && stackHints.some(isFirstPartyHint)) return true;

  return false;
}

function shouldIncludeConversionRiskItem(item) {
  const kind = safeStr(item?.kind).toLowerCase();
  const step = safeStr(item?.step).toLowerCase();
  const path = pagePathOf(item);
  const isPublic = isPublicFunnelPath(path);
  const hasUser = !!safeStr(item?.userId);

  if (isKnownLowSignalNoise(item)) return false;

  if (kind === 'complaint') {
    if (!isPublic) return false;
    if (step === 'auth_page') return true;
    if (!hasUser) return true;
    return path === '/login' || path === '/' || path.startsWith('/contact');
  }

  if (!isPublic) return false;
  if (!step.startsWith('auto_error:') && kind !== 'bug') return false;

  if (hasHighRiskAuthSignal(item)) return true;
  if (hasActionableCspSignal(item)) return true;
  if (hasFirstPartyRuntimeBreak(item)) return true;

  return false;
}

function toMillis(tsLike) {
  try {
    if (!tsLike) return 0;
    if (typeof tsLike?.toMillis === 'function') return tsLike.toMillis() || 0;
    const s = tsLike?._seconds ?? tsLike?.seconds;
    const ns = tsLike?._nanoseconds ?? tsLike?.nanoseconds;
    if (typeof s === 'number' && Number.isFinite(s)) {
      const n = typeof ns === 'number' && Number.isFinite(ns) ? ns : 0;
      return Math.floor(s * 1000 + n / 1e6);
    }
    if (typeof tsLike === 'number' && Number.isFinite(tsLike)) return Math.floor(tsLike);
    return 0;
  } catch {
    return 0;
  }
}

export default async function adminFeedbackList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  await requireAdmin(req);
  const body = normalizeBody(req);

  const kind = safeStr(body?.kind).toLowerCase();
  const status = safeStr(body?.status).toLowerCase();
  const qText = safeStr(body?.q);
  const includeLowSignal = body?.includeLowSignal === true;
  const limit = Math.min(200, Math.max(1, safeInt(body?.limit, 50)));
  const sinceMs = Math.max(0, safeInt(body?.sinceMs, 0));
  const untilMs = Math.max(0, safeInt(body?.untilMs, 0));

  const { db } = getAdmin();

  // IMPORTANT: Firestore requires composite indexes for queries like
  //   where('status','==',...) + orderBy('createdAt','desc')
  // To keep admin panel working without manual index setup, we fetch a recent window
  // ordered by createdAt and apply filters in memory.
  const baseLimit = Math.min(1000, Math.max(100, limit * 10));
  const ref = db.collection('matchmakingFeedback');

  const snap = await ref.orderBy('createdAt', 'desc').limit(baseLimit).get();
  const itemsRaw = snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      ...data,
      // JSON ile gelirken Timestamp metodları kayboluyor; ms olarak gönder.
      createdAt: toMillis(data?.createdAt),
      updatedAt: toMillis(data?.updatedAt),
    };
  });

  const qLower = qText ? qText.toLowerCase() : '';
  const itemsFiltered = itemsRaw.filter((x) => {
    const createdAtMs = safeInt(x?.createdAt, 0);
    if (sinceMs && (!createdAtMs || createdAtMs < sinceMs)) return false;
    if (untilMs && createdAtMs > untilMs) return false;
    if (kind && safeStr(x?.kind).toLowerCase() !== kind) return false;
    if (status && safeStr(x?.status).toLowerCase() !== status) return false;
    if (!includeLowSignal && !shouldIncludeConversionRiskItem(x)) return false;
    if (qLower) {
      const hay = `${safeStr(x?.id)} ${safeStr(x?.matchId)} ${safeStr(x?.userId)} ${safeStr(x?.userEmail)} ${safeStr(x?.step)} ${safeStr(x?.message)} ${safeStr(x?.text)} ${pagePathOf(x)}`.toLowerCase();
      if (!hay.includes(qLower)) return false;
    }
    return true;
  });

  const items = itemsFiltered.slice(0, limit);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, items }));
}
