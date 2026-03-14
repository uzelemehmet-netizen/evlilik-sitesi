import React from 'react';

function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function formatTs(ms) {
  const t = safeNum(ms);
  if (!t) return '';
  try {
    return new Date(t).toLocaleString('tr-TR');
  } catch {
    return String(t);
  }
}

export default function SystemAlertsTab({ geminiAlerts = [] }) {
  const items = Array.isArray(geminiAlerts) ? geminiAlerts : [];

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sistem Uyarıları</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gemini çeviri dakikalık limit aşımlarını burada görürsün. Bu uyarılar gelmeye başlarsa ücretli/kurumsal plana
            (Vertex AI) geçme zamanı.
          </p>
        </div>
        <div className="text-xs text-gray-500">Realtime</div>
      </div>

      <div className="mt-4 space-y-3">
        {!items.length ? (
          <div className="text-sm text-gray-700">Şu an yeni uyarı yok.</div>
        ) : (
          items.slice(0, 20).map((it) => (
            <div key={it.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-amber-950">Gemini RPM limit aşıldı</div>
                <div className="text-xs text-amber-900/80">{formatTs(it.createdAtMs || it.createdAt)}</div>
              </div>
              <div className="mt-1 text-sm text-amber-950/90">
                Dakika anahtarı: <span className="font-mono">{String(it.key || it.minuteKey || it.id || '')}</span>
              </div>
              <div className="mt-1 text-xs text-amber-900/80">
                Limit: {safeNum(it.limitPerMinute) || 15}/dk • Sayım: {safeNum(it.count)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Not: Uyarı dokümanları server-side üretilir; client yazımı kapalıdır.
      </div>
    </div>
  );
}
