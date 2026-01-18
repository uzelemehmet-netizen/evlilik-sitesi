export function formatMaybeTimestamp(ts) {
  // Firestore Timestamp -> ts.toDate()
  try {
    if (!ts) return "";
    const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("tr-TR");
  } catch {
    return "";
  }
}
