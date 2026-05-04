function normalizeSlotArray(value, maxSlots = 5, emptyValue = '') {
  const raw = Array.isArray(value) ? value.slice(0, maxSlots) : [];
  const out = raw.map((item) => (item === undefined ? emptyValue : item));
  while (out.length < maxSlots) out.push(emptyValue);
  return out;
}

function moveSlotToFront(value, index, { maxSlots = 5, emptyValue = '' } = {}) {
  const out = normalizeSlotArray(value, maxSlots, emptyValue);
  if (!Number.isInteger(index) || index <= 0 || index >= maxSlots) return out;
  [out[0], out[index]] = [out[index], out[0]];
  return out;
}

export { moveSlotToFront, normalizeSlotArray };