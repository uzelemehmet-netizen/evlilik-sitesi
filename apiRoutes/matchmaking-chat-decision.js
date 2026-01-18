import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeDecision(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'continue' || s === 'accept' || s === 'approve') return 'continue';
  if (s === 'reject' || s === 'decline') return 'reject';
  return '';
}

function nowMs() {
  return Date.now();
}

function isMembershipActive(userDoc) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > Date.now();
}

export default async function handler(req, res) {
  // Yeni akışta chat kararları kullanılmıyor. İletişim açma/lock mantığı
  // matchmaking-interaction-choice ile yönetiliyor.
  res.statusCode = 410;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: false, error: 'deprecated' }));
}
