import { isMembershipActive } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function parseIntOr(v, fallback) {
  const n = Number.parseInt(String(v || ''), 10);
  // Güvenli varsayılan: limitleri 0/negatif yapıp çeviriyi tamamen kilitlemeyelim.
  // (Eğer çeviriyi kapatmak istenirse bunun için ayrı bir feature flag kullanılmalı.)
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function dayKeyUTC(ms = Date.now()) {
  try {
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return 'unknown';
  }
}

export function monthKeyUTC(ms = Date.now()) {
  try {
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  } catch {
    return 'unknown';
  }
}

export function getMembershipPlan(userDoc) {
  const raw = typeof userDoc?.membership?.plan === 'string' ? userDoc.membership.plan : '';
  const s = safeStr(raw).toLowerCase();
  if (s === 'pro') return 'pro';
  if (s === 'standard') return 'standard';
  if (s === 'eco' || s === 'economic') return 'eco';
  return '';
}

export function getEffectiveTranslationPlan(userDoc, now = Date.now()) {
  // Chat çevirisi için “kimseyi çevirisiz bırakma” prensibi:
  // Üyelik aktif değilse bile düşük bir free plan limiti uygulanır.
  if (isMembershipActive(userDoc, now)) {
    const plan = getMembershipPlan(userDoc);
    return plan || 'eco';
  }
  return 'free';
}

export function getDailyTranslateLimitForPlan(plan) {
  const p = safeStr(plan).toLowerCase();

  // Env override (kolay ayar için)
  // Not: mesaj sayısı bazlı limit.
  if (p === 'pro') return parseIntOr(process.env.TRANSLATE_DAILY_LIMIT_PRO, 2000);
  if (p === 'standard') return parseIntOr(process.env.TRANSLATE_DAILY_LIMIT_STANDARD, 300);
  if (p === 'eco') return parseIntOr(process.env.TRANSLATE_DAILY_LIMIT_ECO, 80);
  if (p === 'free') return parseIntOr(process.env.TRANSLATE_DAILY_LIMIT_FREE, 20);

  return parseIntOr(process.env.TRANSLATE_DAILY_LIMIT_FREE, 20);
}

export function getMonthlyTranslateLimitForPlan(plan) {
  const p = safeStr(plan).toLowerCase();

  // Not: kota birimi mesaj sayısıdır.
  // Öncelik: aylık env varsa onu kullan; yoksa güvenli varsayılanları uygula.
  if (p === 'pro') return parseIntOr(process.env.TRANSLATE_MONTHLY_LIMIT_PRO, 1000);
  if (p === 'standard') return parseIntOr(process.env.TRANSLATE_MONTHLY_LIMIT_STANDARD, 400);
  if (p === 'eco') return parseIntOr(process.env.TRANSLATE_MONTHLY_LIMIT_ECO, 200);
  if (p === 'free') return parseIntOr(process.env.TRANSLATE_MONTHLY_LIMIT_FREE, 50);

  return parseIntOr(process.env.TRANSLATE_MONTHLY_LIMIT_FREE, 50);
}

export function getBoostForUser(userDoc, now = Date.now()) {
  const b = userDoc?.translationBoost && typeof userDoc.translationBoost === 'object' ? userDoc.translationBoost : null;
  if (!b || b.active !== true) return { unlimited: false, extraDaily: 0 };

  const until = typeof b.validUntilMs === 'number' ? b.validUntilMs : 0;
  if (until && until <= now) return { unlimited: false, extraDaily: 0 };

  const unlimited = b.unlimited === true;
  const extraDaily = typeof b.extraDailyCount === 'number' && Number.isFinite(b.extraDailyCount) ? b.extraDailyCount : 0;
  return { unlimited, extraDaily: Math.max(0, extraDaily) };
}

export function getUsageForDay(userDoc, dayKey) {
  const usage = userDoc?.translationUsageDaily && typeof userDoc.translationUsageDaily === 'object' ? userDoc.translationUsageDaily : null;
  const row = usage && usage[dayKey] && typeof usage[dayKey] === 'object' ? usage[dayKey] : null;
  const count = typeof row?.count === 'number' && Number.isFinite(row.count) ? row.count : 0;
  return { count };
}

export function getUsageForMonth(userDoc, monthKey) {
  const usageMonthly =
    userDoc?.translationUsageMonthly && typeof userDoc.translationUsageMonthly === 'object' ? userDoc.translationUsageMonthly : null;
  const rowMonthly = usageMonthly && usageMonthly[monthKey] && typeof usageMonthly[monthKey] === 'object' ? usageMonthly[monthKey] : null;
  const countMonthly = typeof rowMonthly?.count === 'number' && Number.isFinite(rowMonthly.count) ? rowMonthly.count : 0;
  if (countMonthly > 0) return { count: countMonthly };

  // Backward-compat: aylık sayaç yoksa, aynı ayın günlüklerini topla.
  const usageDaily =
    userDoc?.translationUsageDaily && typeof userDoc.translationUsageDaily === 'object' ? userDoc.translationUsageDaily : null;
  if (!usageDaily) return { count: 0 };

  const prefix = `${monthKey}-`;
  let sum = 0;
  for (const [k, v] of Object.entries(usageDaily)) {
    if (!k || typeof k !== 'string') continue;
    if (!k.startsWith(prefix)) continue;
    const c = typeof v?.count === 'number' && Number.isFinite(v.count) ? v.count : 0;
    sum += c;
  }
  return { count: sum };
}

export function getTranslationAccessRow(matchDoc, uid) {
  const ta = matchDoc?.translationAccess && typeof matchDoc.translationAccess === 'object' ? matchDoc.translationAccess : null;
  const row = ta && ta[uid] && typeof ta[uid] === 'object' ? ta[uid] : null;
  return row || null;
}

export function isSponsoredTranslationRevoked(matchDoc, uid) {
  const row = getTranslationAccessRow(matchDoc, uid);
  return { revoked: !!row?.revoked, revokedAtMs: typeof row?.revokedAtMs === 'number' ? row.revokedAtMs : 0 };
}

export function computeTranslationBilling({ requesterUid, requesterDoc, otherUid, otherDoc, matchDoc, now = Date.now() }) {
  const requesterPlan = getEffectiveTranslationPlan(requesterDoc, now);
  const otherPlan = getEffectiveTranslationPlan(otherDoc, now);

  const requesterBoost = getBoostForUser(requesterDoc, now);
  const otherBoost = getBoostForUser(otherDoc, now);

  const requesterBaseMonthly = getMonthlyTranslateLimitForPlan(requesterPlan);
  const otherBaseMonthly = getMonthlyTranslateLimitForPlan(otherPlan);

  // Boost alanları geçmişte “günlük” diye isimlendi; aylık kotada geri uyum için *30 uygula.
  const requesterExtraMonthly = (requesterBoost.extraDaily || 0) * 30;
  const otherExtraMonthly = (otherBoost.extraDaily || 0) * 30;

  const requesterLimit = requesterBoost.unlimited ? Infinity : requesterBaseMonthly + requesterExtraMonthly;
  const otherLimit = otherBoost.unlimited ? Infinity : otherBaseMonthly + otherExtraMonthly;

  const sponsorEligible = (otherPlan === 'standard' || otherPlan === 'pro') && isMembershipActive(otherDoc, now);
  const revoked = isSponsoredTranslationRevoked(matchDoc, requesterUid);

  // Hibrit kural:
  // - Herkes self limitiyle çeviri kullanabilir.
  // - Free/Eko kullanıcı için karşı taraf Standard/Pro ise sponsorlu (maliyeti sponsor çeker)
  //   ama sponsor kapatıldıysa self’e düşer.
  if ((requesterPlan === 'free' || requesterPlan === 'eco') && sponsorEligible && otherUid && !revoked.revoked) {
    return {
      mode: 'sponsored',
      billingUid: String(otherUid),
      monthlyLimit: otherLimit,
      selfMonthlyLimit: requesterLimit,
      sponsorMonthlyLimit: otherLimit,
      requesterPlan,
      sponsorPlan: otherPlan,
      reason: 'sponsor',
    };
  }

  return {
    mode: 'self',
    billingUid: String(requesterUid),
    monthlyLimit: requesterLimit,
    selfMonthlyLimit: requesterLimit,
    sponsorMonthlyLimit: otherLimit,
    requesterPlan,
    sponsorPlan: otherPlan,
    reason: revoked.revoked ? 'sponsor_revoked' : 'self',
  };
}
