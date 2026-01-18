export const SITE_VARIANT = String(import.meta.env.VITE_SITE_VARIANT || "wedding").toLowerCase();

// Backward-compat export (used in a few utilities)
export const isGlobalVariant = SITE_VARIANT === "global";

const WEDDING_VARIANTS = new Set(["wedding", "evlilik", "marriage", "matchmaking"]);
const TRAVEL_VARIANTS = new Set(["travel", "tr", "tur", "tour", "global"]);

const isWeddingVariant = WEDDING_VARIANTS.has(SITE_VARIANT);
const isTravelVariant = TRAVEL_VARIANTS.has(SITE_VARIANT);

// Backward-compatible defaults:
// - Unknown variant => assume wedding (this repo copy is for the wedding site)
// - "global" behaves like travel-focused (no wedding)
const resolvedWedding = isWeddingVariant || (!isTravelVariant && !isGlobalVariant);
const resolvedTravel = isTravelVariant;

export const SITE_FEATURES = Object.freeze({
  wedding: resolvedWedding,
  travel: resolvedTravel,
  tours: resolvedTravel,
  explore: resolvedTravel,
  documents: resolvedTravel,
});

export function isFeatureEnabled(featureKey) {
  return Boolean(SITE_FEATURES[featureKey]);
}
