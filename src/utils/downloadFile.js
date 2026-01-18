export function downloadTextFile({ filename, text, mimeType = "text/plain;charset=utf-8" }) {
  const safeName = String(filename || "download.txt").replace(/[\\/:*?"<>|]+/g, "-");
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Release URL shortly after click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson({ filename, data }) {
  const text = JSON.stringify(data, null, 2);
  downloadTextFile({
    filename: filename.endsWith(".json") ? filename : `${filename}.json`,
    text,
    mimeType: "application/json;charset=utf-8",
  });
}

function escapeCsvValue(v) {
  const s = String(v ?? "");
  const mustQuote = /[\n\r\t,\"]/g.test(s);
  const escaped = s.replace(/\"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

export function downloadCsv({ filename, rows }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) {
    downloadTextFile({
      filename: filename.endsWith(".csv") ? filename : `${filename}.csv`,
      text: "",
      mimeType: "text/csv;charset=utf-8",
    });
    return;
  }

  const headers = Object.keys(safeRows[0] || {});
  const lines = [];
  lines.push(headers.map(escapeCsvValue).join(","));
  for (const row of safeRows) {
    lines.push(headers.map((h) => escapeCsvValue(row?.[h])).join(","));
  }

  downloadTextFile({
    filename: filename.endsWith(".csv") ? filename : `${filename}.csv`,
    text: lines.join("\n"),
    mimeType: "text/csv;charset=utf-8",
  });
}
