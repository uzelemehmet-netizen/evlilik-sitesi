import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tiktokPage } from '../utils/tiktokPixel';
import { trackClick } from '../utils/clickTracker';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toEventKeySafe(raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  return s
    .replace(/[^a-z0-9:_./-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 110);
}

function normalizePathForKey(pathname) {
  const raw = safeStr(pathname) || '/';
  const parts = raw.split('/').filter(Boolean);
  const cleaned = [];
  for (const p of parts) {
    const seg = safeStr(p);
    if (!seg) continue;
    if (/^[0-9a-f]{16,}$/i.test(seg)) {
      cleaned.push(':id');
      continue;
    }
    if (/^[a-z0-9_-]{20,}$/i.test(seg)) {
      cleaned.push(':id');
      continue;
    }
    if (/^\d{3,}$/.test(seg)) {
      cleaned.push(':n');
      continue;
    }
    cleaned.push(seg.slice(0, 24));
    if (cleaned.length >= 4) break;
  }
  return cleaned.length ? `/${cleaned.join('/')}` : '/';
}

function normalizePathForEventKey(pathname) {
  const p = normalizePathForKey(pathname);
  if (p === '/') return 'root';
  // Firestore map keys can be picky in some environments; avoid '/' in event keys.
  return p.replace(/^\//, '').replace(/\//g, '_').slice(0, 80) || 'root';
}

function looksSensitiveLabel(s) {
  const v = safeStr(s);
  if (!v) return false;
  if (v.includes('@')) return true;
  if (/\bhttps?:\/\//i.test(v)) return true;
  if (/\b\+?\d[\d\s().-]{7,}\b/.test(v)) return true; // phone-ish
  return false;
}

function elementKeyFromNode(node) {
  if (!node) return '';
  const el = node;
  if (!el || typeof el.getAttribute !== 'function') return '';

  const tag = String(el.tagName || '').toLowerCase();

  const explicit = safeStr(el.getAttribute('data-track'));
  if (explicit) return `x:${explicit}`;

  const id = safeStr(el.id);
  if (id) return `id:${id}`;

  const name = safeStr(el.getAttribute('name'));
  if (name) return `name:${name}`;

  const aria = safeStr(el.getAttribute('aria-label'));
  if (aria && !looksSensitiveLabel(aria)) return `aria:${aria.slice(0, 40)}`;

  if (tag === 'a') {
    const href = safeStr(el.getAttribute('href'));
    if (href && !href.startsWith('javascript:')) {
      try {
        const u = new URL(href, window.location.origin);
        const p = normalizePathForEventKey(u.pathname);
        return `link:${p}`;
      } catch {
        // ignore
      }
    }
  }

  if (tag === 'button') {
    const type = safeStr(el.getAttribute('type')) || 'button';
    return `btn:${type}`;
  }

  const role = safeStr(el.getAttribute('role'));
  if (role) return `${tag}:${role}`;

  return tag || 'click';
}

function detectLandingSourceFromReferrer(ref) {
  const s = safeStr(ref).toLowerCase();
  if (!s) return '';

  // Keep this coarse: no full URLs stored, only a small source label.
  if (
    s.includes('googleadservices.') ||
    s.includes('adservice.google.') ||
    s.includes('googlesyndication.') ||
    s.includes('clickserve.dartsearch.net') ||
    s.includes('g.doubleclick.') ||
    s.includes('doubleclick.') ||
    // broad fallback (country TLDs etc.)
    s.includes('google.')
  ) {
    return 'google';
  }
  if (s.includes('tiktok.')) return 'tiktok';
  if (s.includes('facebook.') || s.includes('fb.com') || s.includes('instagram.')) return 'meta';
  if (s.includes('bing.com') || s.includes('microsoft.')) return 'microsoft';

  return '';
}

export default function AnalyticsTracker() {
  const location = useLocation();

  // Global UI click traces (best-effort): helps diagnose "ads clicks but no on-site activity".
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__uniqah_ui_trace_installed) return;
    window.__uniqah_ui_trace_installed = true;

    const shouldIgnorePath = () => {
      const p = safeStr(window.location?.pathname);
      return p.startsWith('/admin');
    };

    const buildPage = () => {
      const p = safeStr(window.location?.pathname) || '/';
      const s = safeStr(window.location?.search);
      return `${p}${s}`;
    };

    const handler = (e) => {
      try {
        if (shouldIgnorePath()) return;

        const target = e?.target;
        if (!target || typeof target.closest !== 'function') return;

        const el = target.closest('button, a, [role="button"]');
        if (!el) return;
        if (el.closest('[data-no-track]')) return;

        const page = buildPage();
        const pathKey = normalizePathForEventKey(window.location?.pathname);
        const elementKey = elementKeyFromNode(el);
        const eventKey = toEventKeySafe(`ui_click:${pathKey}:${elementKey}`);
        if (!eventKey) return;

        trackClick(eventKey, { page, trace: true });
      } catch {
        // ignore
      }
    };

    const submitHandler = (e) => {
      try {
        if (shouldIgnorePath()) return;
        const form = e?.target;
        if (!form || typeof form.getAttribute !== 'function') return;

        const page = buildPage();
        const pathKey = normalizePathForEventKey(window.location?.pathname);
        const id = safeStr(form.id);
        const name = safeStr(form.getAttribute('name'));
        const key = id ? `form:${id}` : name ? `form:${name}` : 'form:submit';
        const eventKey = toEventKeySafe(`ui_submit:${pathKey}:${key}`);
        if (!eventKey) return;

        trackClick(eventKey, { page, trace: true });
      } catch {
        // ignore
      }
    };

    document.addEventListener('click', handler, true);
    document.addEventListener('submit', submitHandler, true);
    return () => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('submit', submitHandler, true);
    };
  }, []);

  useEffect(() => {
    const path = safeStr(location.pathname) || '/';
    const search = safeStr(location.search);
    const page = `${path}${search}`;

    // Skip admin routes to avoid polluting analytics.
    if (path.startsWith('/admin')) return;

    // Arrival tracking: proves the user actually reached the SPA and JS executed.
    try {
        const pathKey = normalizePathForEventKey(path);
        const arrivalKey = toEventKeySafe(`arrival:${pathKey}`);
      if (arrivalKey) trackClick(arrivalKey, { page });

      // Session start (once per tab/session).
      // Some browsers/webviews throw on sessionStorage access; use a window flag fallback.
      const ssKey = 'uniqah_session_start_v1';
      const winKey = '__uniqah_session_start_sent_v1';
      let already = '';
      try {
        already = safeStr(window.sessionStorage?.getItem(ssKey));
      } catch {
        already = '';
      }
      const alreadyWin = (() => {
        try {
          return window[winKey] === 1;
        } catch {
          return false;
        }
      })();
      if (!already && !alreadyWin) {
        try {
          window[winKey] = 1;
        } catch {
          // ignore
        }
        try {
          window.sessionStorage?.setItem(ssKey, '1');
        } catch {
          // ignore
        }
        trackClick('session_start', { page });
      }
    } catch {
      // ignore
    }

    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: page,
        page_location: typeof window !== 'undefined' ? window.location.href : undefined,
        page_title: typeof document !== 'undefined' ? document.title : undefined,
      });
    }

    tiktokPage();

    // Pixel presence diagnostics (best-effort; helps spot adblock / script blocking)
    try {
      const key = 'uniqah_pixel_diag_v1';
      const raw = safeStr(window.sessionStorage?.getItem(key));
      const parsed = raw ? JSON.parse(raw) : {};

      const mark = (k) => {
        try {
          const next = { ...(parsed && typeof parsed === 'object' ? parsed : {}), [k]: 1 };
          window.sessionStorage?.setItem(key, JSON.stringify(next));
        } catch {
          // ignore
        }
      };

      window.setTimeout(() => {
        try {
          const hasGtag = typeof window.gtag === 'function';
          const hasTiktok = typeof window.ttq === 'function' || (window.ttq && typeof window.ttq.track === 'function');

          if (!hasGtag && !parsed?.ga4_missing) {
            mark('ga4_missing');
            trackClick('pixel_missing:ga4', { page });
          }
          if (!hasTiktok && !parsed?.tiktok_missing) {
            mark('tiktok_missing');
            trackClick('pixel_missing:tiktok', { page });
          }
        } catch {
          // ignore
        }
      }, 3000);
    } catch {
      // ignore
    }

    // Lightweight server-side deduped tracking (best-effort)
    try {
      const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
      const utmSource = safeStr(params.get('utm_source'));
      const utmMedium = safeStr(params.get('utm_medium'));
      const utmCampaign = safeStr(params.get('utm_campaign'));

      // Ad click IDs (many platforms don't add UTM by default)
      const gclid = safeStr(params.get('gclid'));
      const wbraid = safeStr(params.get('wbraid'));
      const gbraid = safeStr(params.get('gbraid'));
      const ttclid = safeStr(params.get('ttclid'));
      const fbclid = safeStr(params.get('fbclid'));
      const msclkid = safeStr(params.get('msclkid'));

      // Only track if any UTM exists to avoid noise.
      if (utmSource || utmMedium || utmCampaign) {
        const base = toEventKeySafe(`landing_utm:${utmSource || 'unknown'}`);
        if (base) trackClick(base, { page });

        const camp = toEventKeySafe(`landing_campaign:${utmCampaign || 'unknown'}`);
        if (camp) trackClick(camp, { page });
      }

      // Track presence of click IDs (no raw IDs stored)
      if (gclid || wbraid || gbraid) trackClick('landing_clickid:google', { page });
      if (ttclid) trackClick('landing_clickid:tiktok', { page });
      if (fbclid) trackClick('landing_clickid:meta', { page });
      if (msclkid) trackClick('landing_clickid:microsoft', { page });

      // Referrer-based fallback: helps when click IDs are stripped by redirects.
      // Dedupe once per session to avoid noise (window flag; sessionStorage may be unavailable).
      try {
        const key = 'uniqah_landing_ref_v1';
        const winKey = '__uniqah_landing_ref_sent_v1';

        const alreadyWin = (() => {
          try {
            return window[winKey] === 1;
          } catch {
            return false;
          }
        })();

        let already = '';
        try {
          already = safeStr(window.sessionStorage?.getItem(key));
        } catch {
          already = '';
        }

        if (!already && !alreadyWin) {
          const src = detectLandingSourceFromReferrer(document?.referrer || '');
          if (src) {
            try {
              window[winKey] = 1;
            } catch {
              // ignore
            }
            try {
              window.sessionStorage?.setItem(key, '1');
            } catch {
              // ignore
            }
            trackClick(`landing_ref:${src}`, { page });
          }
        }
      } catch {
        // ignore
      }

      // Track explicit signup landing
      if (path === '/login') {
        const mode = safeStr(params.get('mode'));
        if (mode === 'signup') trackClick('landing_login_signup', { page });
        if (mode === 'login') trackClick('landing_login_login', { page });
      }
    } catch {
      // ignore
    }
  }, [location]);

  return null;
}
