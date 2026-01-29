function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function clampInt(v, { min = -Infinity, max = Infinity } = {}) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const x = Math.round(n);
  if (x < min || x > max) return null;
  return x;
}

function getMinAgeFromEnv() {
  const raw = String(process.env.MATCHMAKING_MIN_AGE || '').trim();
  const n = raw ? Number(raw) : NaN;
  // Ürün kararı: varsayılan 21 (TR/ID evlilik yaşı kuralı)
  if (Number.isFinite(n) && n >= 18 && n <= 99) return Math.floor(n);
  return 21;
}

const AGE_GROUPS = [
  { min: 20, max: 25 },
  { min: 26, max: 30 },
  { min: 31, max: 35 },
  { min: 36, max: 40 },
  { min: 41, max: 45 },
  { min: 46, max: 50 },
  { min: 51, max: 55 },
  { min: 56, max: 60 },
  { min: 61, max: 99 },
];

function ageGroupIndexForAge(age) {
  if (typeof age !== 'number' || !Number.isFinite(age)) return -1;
  for (let i = 0; i < AGE_GROUPS.length; i += 1) {
    const g = AGE_GROUPS[i];
    if (age >= g.min && age <= g.max) return i;
  }
  return -1;
}

function ageGroupDistanceByAges(aAge, bAge) {
  const ia = ageGroupIndexForAge(aAge);
  const ib = ageGroupIndexForAge(bAge);
  if (ia < 0 || ib < 0) return Infinity;
  return Math.abs(ia - ib);
}

function resolveAgeRangeFromPrefs({ seekerAge, prefs, minAge }) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const mi = asNum(p?.ageMin);
  const ma = asNum(p?.ageMax);
  if (mi !== null || ma !== null) {
    const min = mi !== null ? Math.max(minAge, Math.floor(mi)) : minAge;
    const max = ma !== null ? Math.min(99, Math.floor(ma)) : 99;
    return { min, max };
  }

  const older = asNum(p?.ageMaxOlderYears);
  const younger = asNum(p?.ageMaxYoungerYears);
  if ((older !== null || younger !== null) && typeof seekerAge === 'number' && Number.isFinite(seekerAge)) {
    const o = older ?? 0;
    const y = younger ?? 0;
    const min = Math.max(minAge, seekerAge - y);
    const max = Math.min(99, seekerAge + o);
    return { min, max };
  }

  // Tercih yoksa: yaş aralığı kuralı kısıt üretmesin.
  return { min: minAge, max: 99 };
}

function isOneWayAgeAllowed({ seekerAge, seekerPrefs, candAge, minAge }) {
  if (typeof seekerAge !== 'number' || !Number.isFinite(seekerAge)) return false;
  if (typeof candAge !== 'number' || !Number.isFinite(candAge)) return false;
  if (seekerAge < minAge || candAge < minAge) return false;

  const range = resolveAgeRangeFromPrefs({ seekerAge, prefs: seekerPrefs, minAge });
  return candAge >= range.min && candAge <= range.max;
}

function isMutualAgeAllowed({ aAge, aPrefs, bAge, bPrefs, minAge }) {
  return (
    isOneWayAgeAllowed({ seekerAge: aAge, seekerPrefs: aPrefs, candAge: bAge, minAge }) &&
    isOneWayAgeAllowed({ seekerAge: bAge, seekerPrefs: bPrefs, candAge: aAge, minAge })
  );
}

function getAgeGroupMaxExpandFromEnv() {
  const n = clampInt(process.env.MATCHMAKING_AGE_GROUP_MAX_EXPAND, { min: 0, max: 8 });
  return n === null ? 2 : n;
}

function getStrictGroupMinCandidatesFromEnv() {
  const n = clampInt(process.env.MATCHMAKING_STRICT_GROUP_MIN_CANDIDATES, { min: 0, max: 1000 });
  return n === null ? 20 : n;
}

function decideAgeGroupExpandCount({ strictSameGroupCandidateCount, strictMinCandidates, maxExpand }) {
  const need = typeof strictSameGroupCandidateCount === 'number' ? strictSameGroupCandidateCount : 0;
  const min = typeof strictMinCandidates === 'number' ? strictMinCandidates : 0;
  const max = typeof maxExpand === 'number' ? maxExpand : 0;
  return need >= min ? 0 : max;
}

export {
  AGE_GROUPS,
  getMinAgeFromEnv,
  ageGroupIndexForAge,
  ageGroupDistanceByAges,
  resolveAgeRangeFromPrefs,
  isOneWayAgeAllowed,
  isMutualAgeAllowed,
  getAgeGroupMaxExpandFromEnv,
  getStrictGroupMinCandidatesFromEnv,
  decideAgeGroupExpandCount,
};
