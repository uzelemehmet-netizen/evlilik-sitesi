import {
  computeTranslationBilling,
  getMonthlyTranslateLimitForPlan,
  getEffectiveTranslationPlan,
  monthKeyUTC,
} from '../apiRoutes/_translationPolicy.js';

function assert(cond, msg) {
  if (!cond) {
    console.error('ASSERT FAIL:', msg);
    process.exitCode = 1;
  }
}

function user({ active, plan, boost } = {}) {
  return {
    membership: active
      ? {
          active: true,
          validUntilMs: Date.now() + 7 * 86400000,
          plan,
        }
      : {
          active: false,
          validUntilMs: 0,
          plan,
        },
    ...(boost ? { translationBoost: boost } : {}),
  };
}

function match({ revokedFor } = {}) {
  return {
    translationAccess: revokedFor
      ? {
          [revokedFor]: {
            revoked: true,
            revokedAtMs: Date.now(),
          },
        }
      : {},
  };
}

const now = Date.now();

// 1) Free user self
{
  const me = user({ active: false });
  const plan = getEffectiveTranslationPlan(me, now);
  assert(plan === 'free', 'non-member should be free plan');
  assert(getMonthlyTranslateLimitForPlan(plan) > 0, 'free plan should have positive monthly limit');
}

// 2) Eco requester + Pro other => sponsored
{
  const me = user({ active: true, plan: 'eco' });
  const other = user({ active: true, plan: 'pro' });
  const b = computeTranslationBilling({ requesterUid: 'a', requesterDoc: me, otherUid: 'b', otherDoc: other, matchDoc: match(), now });
  assert(b.mode === 'sponsored', 'eco should be sponsored by pro');
  assert(b.billingUid === 'b', 'billing should be sponsor uid');
}

// 3) Eco requester + Pro other but revoked => self
{
  const me = user({ active: true, plan: 'eco' });
  const other = user({ active: true, plan: 'pro' });
  const b = computeTranslationBilling({
    requesterUid: 'a',
    requesterDoc: me,
    otherUid: 'b',
    otherDoc: other,
    matchDoc: match({ revokedFor: 'a' }),
    now,
  });
  assert(b.mode === 'self', 'revoked should fall back to self');
  assert(b.billingUid === 'a', 'billing should be requester uid');
}

// 4) Standard requester => self
{
  const me = user({ active: true, plan: 'standard' });
  const other = user({ active: true, plan: 'pro' });
  const b = computeTranslationBilling({ requesterUid: 'a', requesterDoc: me, otherUid: 'b', otherDoc: other, matchDoc: match(), now });
  assert(b.mode === 'self', 'standard should bill self');
}

// 5) Boost unlimited
{
  const me = user({
    active: true,
    plan: 'eco',
    boost: { active: true, validUntilMs: Date.now() + 3600000, unlimited: true },
  });
  const other = user({ active: true, plan: 'eco' });
  const b = computeTranslationBilling({ requesterUid: 'a', requesterDoc: me, otherUid: 'b', otherDoc: other, matchDoc: match(), now });
  assert(b.mode === 'self', 'eco with no sponsor should self');
  assert(b.monthlyLimit === Infinity, 'unlimited boost should yield Infinity monthlyLimit');
}

console.log('monthKeyUTC(now)=', monthKeyUTC(now));
console.log(process.exitCode ? 'Selftest FAILED' : 'Selftest OK');
process.exit(process.exitCode || 0);
