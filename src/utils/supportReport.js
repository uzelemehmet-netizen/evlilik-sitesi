import { auth } from '../config/firebaseAuth.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeJsonStringify(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
}

export function buildSupportReport({ kind, flow = '', code = '', message = '', extra = {} } = {}) {
  const now = Date.now();
  const page = (() => {
    try {
      return typeof window !== 'undefined' ? String(window.location?.href || '') : '';
    } catch {
      return '';
    }
  })();

  const ua = (() => {
    try {
      return typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
    } catch {
      return '';
    }
  })();

  const lang = (() => {
    try {
      return typeof navigator !== 'undefined' ? String(navigator.language || '') : '';
    } catch {
      return '';
    }
  })();

  const ref = (() => {
    try {
      return typeof document !== 'undefined' ? String(document.referrer || '') : '';
    } catch {
      return '';
    }
  })();

  return {
    v: 1,
    kind: safeStr(kind),
    flow: safeStr(flow),
    code: safeStr(code),
    message: safeStr(message),
    ts: now,
    page,
    ref,
    lang,
    ua,
    uid: safeStr(auth?.currentUser?.uid),
    projectId: safeStr(auth?.app?.options?.projectId),
    authDomain: safeStr(auth?.app?.options?.authDomain),
    extra: extra && typeof extra === 'object' ? extra : {},
  };
}

export function storeSupportReport(report) {
  try {
    if (!report || typeof report !== 'object') return false;
    sessionStorage.setItem('uniqah_support_report_v1', safeJsonStringify(report));
    return true;
  } catch {
    return false;
  }
}

export function loadSupportReport() {
  try {
    const raw = sessionStorage.getItem('uniqah_support_report_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatSupportReportText(report) {
  const r = report && typeof report === 'object' ? report : null;
  if (!r) return '';

  const lines = [
    'Merhaba, sistemde bir hata yaşadım. Aşağıdaki raporu paylaşıyorum:',
    `tür: ${safeStr(r.kind) || '-'}`,
    `akış: ${safeStr(r.flow) || '-'}`,
    `kod: ${safeStr(r.code) || '-'}`,
    `mesaj: ${safeStr(r.message) || '-'}`,
    `zaman(ms): ${String(r.ts || '-')}`,
    `sayfa: ${safeStr(r.page) || '-'}`,
    `ref: ${safeStr(r.ref) || '-'}`,
    `lang: ${safeStr(r.lang) || '-'}`,
    `uid: ${safeStr(r.uid) || '-'}`,
    `firebaseProjectId: ${safeStr(r.projectId) || '-'}`,
    `authDomain: ${safeStr(r.authDomain) || '-'}`,
    `ua: ${safeStr(r.ua) || '-'}`,
  ];

  try {
    const extra = r.extra && typeof r.extra === 'object' ? r.extra : null;
    if (extra) {
      const extraStr = safeJsonStringify(extra);
      if (extraStr) lines.push(`extra: ${extraStr.slice(0, 1500)}`);
    }
  } catch {
    // ignore
  }

  return lines.join('\n');
}

export function openSupportReport() {
  try {
    window.location.assign('/contact?report=1');
  } catch {
    // ignore
  }
}
