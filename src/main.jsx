import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Fonts: self-host via @fontsource (avoid runtime Google Fonts requests)
// Limit to latin/latin-ext subsets to avoid huge mobile payload (cyrillic/greek/devanagari/vietnamese, etc.)
// NOTE: Turkish needs latin-ext; Indonesian uses latin.
import '@fontsource/rajdhani/latin-ext-400.css';
import '@fontsource/rajdhani/latin-ext-500.css';
import '@fontsource/rajdhani/latin-ext-600.css';
import '@fontsource/rajdhani/latin-ext-700.css';

import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';

import '@fontsource/orbitron/latin-400.css';
import '@fontsource/orbitron/latin-500.css';
import '@fontsource/orbitron/latin-600.css';
import '@fontsource/orbitron/latin-700.css';

import '@fontsource/poppins/latin-ext-300.css';
import '@fontsource/poppins/latin-ext-400.css';
import '@fontsource/poppins/latin-ext-500.css';
import '@fontsource/poppins/latin-ext-600.css';
import '@fontsource/poppins/latin-ext-700.css';

import '@fontsource/plus-jakarta-sans/latin-ext-400.css';
import '@fontsource/plus-jakarta-sans/latin-ext-500.css';
import '@fontsource/plus-jakarta-sans/latin-ext-600.css';
import '@fontsource/plus-jakarta-sans/latin-ext-700.css';

import './index.css';
import './i18n';
import { i18nReady } from './i18n';
import { AuthProvider } from './auth/AuthProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { registerSW } from 'virtual:pwa-register';
import { detectInstalledRelatedAppsAndMark, markPwaInstalled, reportPwaInstalledToServerBestEffort } from './utils/pwaInstalled.js';
import { buildSupportReport } from './utils/supportReport.js';
import { getClientCountry } from './utils/supportLine.js';
import { getAnonBrowserId } from './utils/clickTracker.js';

// Bazı kullanıcılar (özellikle TR dışı) siteyi Google Translate proxy domain'i üzerinden açabiliyor
// (örn: *.translate.goog). Bu host Firebase Auth (Google login) için authorized domain değildir
// ve bazı tarayıcılarda “site açılmıyor” gibi görünen akış sorunları yaratabilir.
// En güvenlisi: app boot etmeden gerçek domain'e yönlendirmek.
if (typeof window !== 'undefined') {
  try {
    const host = String(window.location?.hostname || '').toLowerCase();
    const isTranslateProxy =
      host === 'translate.googleusercontent.com' ||
      host.endsWith('.translate.goog') ||
      host.includes('translate.goog');

    if (isTranslateProxy) {
      const path = String(window.location?.pathname || '/');
      const search = String(window.location?.search || '');
      const hash = String(window.location?.hash || '');
      // NOTE: query/hash'i koruyoruz (gclid vb. attribution kaybolmasın).
      window.location.replace(`https://uniqah.com${path}${search}${hash}`);
    }
  } catch {
    // ignore
  }
}

// Deploy sonrası bazı kullanıcılarda (özellikle PWA/SW cache veya anlık CDN tutarsızlığı)
// eski HTML -> eski chunk URL'leri nedeniyle modulepreload hatası oluşabiliyor.
// Vite bu durumda `vite:preloadError` event'i tetikler. En pratik çözüm: kontrollü reload.
if (typeof window !== 'undefined') {
  try {
    const KEY = 'uniqah:vite_preload_recover_v1';
    const getCount = () => {
      try {
        const n = Number(sessionStorage.getItem(KEY) || '0');
        return Number.isFinite(n) && n >= 0 ? n : 0;
      } catch {
        return 0;
      }
    };
    const incCount = () => {
      try {
        sessionStorage.setItem(KEY, String(getCount() + 1));
      } catch {
        // ignore
      }
    };

    window.addEventListener('vite:preloadError', (event) => {
      try {
        // Prevent default console noise / potential error overlay behavior.
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
      } catch {
        // ignore
      }

      const count = getCount();
      incCount();

      // 1) First time: simple reload (usually fetches fresh index.html and fixes stale chunk refs).
      if (count < 1) {
        try {
          window.location.reload();
          return;
        } catch {
          // ignore
        }
      }

      // 2) If it keeps happening in the same session: best-effort SW + Cache Storage cleanup.
      (async () => {
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
            for (const reg of regs || []) {
              try {
                await reg.unregister();
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore
        }

        try {
          if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
            const keys = await caches.keys().catch(() => []);
            for (const k of keys || []) {
              try {
                await caches.delete(k);
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore
        }

        try {
          window.location.reload();
        } catch {
          // ignore
        }
      })();
    });
  } catch {
    // ignore
  }
}

// Login olamayan kullanıcılar (özellikle mobil/ID) için: global JS hatalarını yakalayıp
// support'a otomatik raporla. (Session başına sınırlı sayıda gönderim)
if (typeof window !== 'undefined') {
  try {
    // Prefetch country hint (from edge headers) for region-specific WhatsApp routing.
    // Non-blocking; failures are ignored.
    try {
      void getClientCountry();
    } catch {
      // ignore
    }

    const MAX_REPORTS_PER_SESSION = 3;
    const COUNT_KEY = 'uniqah:public_error_report_count_v1';

    // Opaque cross-origin script errors (message='Script error.' with no filename/stack)
    // are often not actionable and can consume the limited per-session quota, preventing
    // real login-blocking errors from being reported. Track them separately.
    const MAX_OPAQUE_REPORTS_PER_SESSION = 1;
    const OPAQUE_COUNT_KEY = 'uniqah:public_error_report_opaque_count_v1';

    const hostHintFromUrlLike = (raw) => {
      try {
        const s = String(raw || '').trim();
        if (!s) return '';
        if (s === 'inline' || s === 'eval' || s === 'self') return s;
        if (s.startsWith('data:')) return 'data:';
        if (s.startsWith('blob:')) return 'blob:';
        if (s.startsWith('about:')) return 'about:';
        try {
          return String(new URL(s).host || '').slice(0, 160);
        } catch {
          // Best-effort for schemeless values
          return String(new URL(`https://${s}`).host || '').slice(0, 160);
        }
      } catch {
        return '';
      }
    };

    const getCount = () => {
      try {
        const n = Number(sessionStorage.getItem(COUNT_KEY) || '0');
        return Number.isFinite(n) && n >= 0 ? n : 0;
      } catch {
        return 0;
      }
    };

    const getOpaqueCount = () => {
      try {
        const n = Number(sessionStorage.getItem(OPAQUE_COUNT_KEY) || '0');
        return Number.isFinite(n) && n >= 0 ? n : 0;
      } catch {
        return 0;
      }
    };

    const incCount = () => {
      try {
        sessionStorage.setItem(COUNT_KEY, String(getCount() + 1));
      } catch {
        // ignore
      }
    };

    const incOpaqueCount = () => {
      try {
        sessionStorage.setItem(OPAQUE_COUNT_KEY, String(getOpaqueCount() + 1));
      } catch {
        // ignore
      }
    };

    const safeSend = async (report, opts = {}) => {
      try {
        const opaque = !!opts?.opaque;
        if (opaque) {
          if (getOpaqueCount() >= MAX_OPAQUE_REPORTS_PER_SESSION) return;
          incOpaqueCount();
        } else {
          if (getCount() >= MAX_REPORTS_PER_SESSION) return;
          incCount();
        }

        const payload = {
          report,
          anonId: (() => {
            try {
              return getAnonBrowserId();
            } catch {
              return '';
            }
          })(),
          pagePath: (() => {
            try {
              return String(window.location?.pathname || '');
            } catch {
              return '';
            }
          })(),
          tz: (() => {
            try {
              return String(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
            } catch {
              return '';
            }
          })(),
        };

        await fetch('/api/public-error-report', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => null);
      } catch {
        // ignore
      }
    };

    const getBasicClientMeta = () => {
      try {
        const nav = typeof navigator !== 'undefined' ? navigator : null;
        const conn = nav && nav.connection ? nav.connection : null;
        return {
          visibility: (() => {
            try {
              return String(document.visibilityState || '');
            } catch {
              return '';
            }
          })(),
          readyState: (() => {
            try {
              return String(document.readyState || '');
            } catch {
              return '';
            }
          })(),
          effectiveType: conn && typeof conn.effectiveType === 'string' ? conn.effectiveType : '',
          downlink: conn && typeof conn.downlink === 'number' ? String(conn.downlink) : '',
          rtt: conn && typeof conn.rtt === 'number' ? String(conn.rtt) : '',
        };
      } catch {
        return {};
      }
    };

    window.addEventListener(
      'error',
      (ev) => {
        try {
          const msgRaw = String(ev?.message || '').slice(0, 800);
          const filename = String(ev?.filename || '').slice(0, 600);
          const lineno = typeof ev?.lineno === 'number' ? ev.lineno : null;
          const colno = typeof ev?.colno === 'number' ? ev.colno : null;
          const stack = typeof ev?.error?.stack === 'string' ? String(ev.error.stack).slice(0, 6000) : '';
          const errorName = typeof ev?.error?.name === 'string' ? String(ev.error.name).slice(0, 120) : '';
          const errorMessage = typeof ev?.error?.message === 'string' ? String(ev.error.message).slice(0, 800) : '';
          const hasErrorObject = !!ev?.error;

          // Resource load errors (script/css/img) often come as a plain Event (no message).
          const target = ev?.target || null;
          const eventType = (() => {
            try {
              return String(ev?.type || '').slice(0, 60);
            } catch {
              return '';
            }
          })();
          const eventIsTrusted = (() => {
            try {
              return typeof ev?.isTrusted === 'boolean' ? ev.isTrusted : null;
            } catch {
              return null;
            }
          })();
          const eventTimeStamp = (() => {
            try {
              return typeof ev?.timeStamp === 'number' ? Math.trunc(ev.timeStamp) : null;
            } catch {
              return null;
            }
          })();
          const targetType = (() => {
            try {
              return String(target?.constructor?.name || '').slice(0, 80);
            } catch {
              return '';
            }
          })();
          const tagName = (() => {
            try {
              return String(target?.tagName || '').toLowerCase();
            } catch {
              return '';
            }
          })();
          const resourceUrl = (() => {
            try {
              const src = target?.src;
              const href = target?.href;
              return String(src || href || '').slice(0, 900);
            } catch {
              return '';
            }
          })();

          const resourceHost = (() => {
            try {
              return hostHintFromUrlLike(resourceUrl);
            } catch {
              return '';
            }
          })();

          // A safe, scheme-less, query/hash-free hint for the *exception filename*.
          // Some environments (and our server-side PII redaction) can turn URLs into "[URL]",
          // which makes it impossible to see which script actually threw.
          const filenameHint = (() => {
            try {
              const raw = String(filename || '').trim();
              if (!raw) return '';
              if (raw === 'inline' || raw === 'eval' || raw === 'self') return raw;
              if (raw.startsWith('data:')) return 'data:';
              if (raw.startsWith('blob:')) return 'blob:';
              if (raw.startsWith('about:')) return 'about:';

              const u = (() => {
                try {
                  return new URL(raw);
                } catch {
                  return new URL(raw, String(window.location?.href || 'https://uniqah.com/'));
                }
              })();

              const host = String(u.host || '').trim();
              const path = String(u.pathname || '').trim();
              const hint = host ? `${host}${path}` : '';
              if (!hint || hint.includes('://') || /[\s\?#@]/.test(hint)) return '';
              return hint.slice(0, 420);
            } catch {
              return '';
            }
          })();

          // Extract safe host+path hints from stack URLs (best-effort).
          const stackUrlHints = (() => {
            try {
              const s = String(stack || '').trim();
              if (!s) return [];
              const matches = s.match(/https?:\/\/[^\s)]+/g) || [];
              const out = [];
              const seen = new Set();

              for (const m of matches) {
                if (out.length >= 6) break;
                try {
                  const u = new URL(m);
                  const host = String(u.host || '').trim();
                  const path = String(u.pathname || '').trim();
                  const hint = host ? `${host}${path}` : '';
                  if (!hint || hint.includes('://') || /[\s\?#@]/.test(hint)) continue;
                  const key = hint.toLowerCase();
                  if (seen.has(key)) continue;
                  seen.add(key);
                  out.push(hint.slice(0, 420));
                } catch {
                  // ignore per-entry
                }
              }

              return out;
            } catch {
              return [];
            }
          })();

          // A safe, scheme-less, query/hash-free hint to keep resource errors actionable
          // even when server-side PII redaction turns URLs into "[URL]".
          const resourceUrlHint = (() => {
            try {
              const raw = String(resourceUrl || '').trim();
              if (!raw) return '';
              if (raw === 'inline' || raw === 'eval' || raw === 'self') return raw;
              if (raw.startsWith('data:')) return 'data:';
              if (raw.startsWith('blob:')) return 'blob:';
              if (raw.startsWith('about:')) return 'about:';

              const u = (() => {
                try {
                  return new URL(raw);
                } catch {
                  // Relative URLs are common for <link href="/foo.css">.
                  return new URL(raw, String(window.location?.href || 'https://uniqah.com/'));
                }
              })();

              const host = String(u.host || '').trim();
              const path = String(u.pathname || '').trim();
              const hint = host ? `${host}${path}` : '';
              // Must be scheme-less and query/hash free.
              if (!hint || hint.includes('://') || /[\s\?#@]/.test(hint)) return '';
              return hint.slice(0, 420);
            } catch {
              return '';
            }
          })();

          const linkRel = (() => {
            try {
              return String(target?.rel || '').toLowerCase().slice(0, 80);
            } catch {
              return '';
            }
          })();

          const linkAs = (() => {
            try {
              return String(target?.as || '').toLowerCase().slice(0, 40);
            } catch {
              return '';
            }
          })();

          const isResourceError = !!resourceUrl && !!tagName && !msgRaw;

          const isKnown3pHostHint = (hintRaw) => {
            try {
              const hint = String(hintRaw || '').toLowerCase();
              if (!hint) return false;
              // Keep conservative: only classify well-known 3p scripts.
              return (
                hint.includes('apis.google.com/js/api.js') ||
                hint.includes('apis.google.com/_/scs/') ||
                hint.includes('google-analytics.com/') ||
                hint.includes('googletagmanager.com/gtag/js') ||
                hint.includes('analytics.tiktok.com/i18n/pixel/events.js')
              );
            } catch {
              return false;
            }
          };

          // Some 3p analytics/pixel scripts are intentionally non-blocking and
          // may fail to load for bots (e.g., vercel-screenshot), adblockers, or
          // restricted networks. These failures are not actionable and create
          // noisy alerts; ignore them.
          const shouldIgnoreResourceLoadError = (() => {
            try {
              if (!isResourceError) return false;
              const hint = String(resourceUrlHint || resourceHost || resourceUrl || '').toLowerCase();
              if (!hint) return false;

              // Google Translate / in-browser translate may inject resources (icons/SVG)
              // that are not required for our app. In some regions/browsers these can fail
              // and create noisy reports.
              if (tagName === 'img') {
                if (hint.includes('fonts.gstatic.com/s/i/productlogos/translate/')) return true;
              }

              if (tagName !== 'script') return false;
              if (hint.includes('googletagmanager.com/gtag/js')) return true;
              if (hint.includes('analytics.tiktok.com/i18n/pixel/events.js')) return true;
              // Some environments (e.g., embedded browsers) attempt to load Google API client.
              // If it is blocked by network policy/filters, we don't want noisy alerts.
              if (hint.includes('apis.google.com/js/api.js')) return true;
              // Adblockers commonly block conversion scripts; these failures are not actionable.
              if (hint.includes('googleads.g.doubleclick.net/pagead/')) return true;
              if (hint.includes('www.googleadservices.com/pagead/')) return true;
              return false;
            } catch {
              return false;
            }
          })();

          if (shouldIgnoreResourceLoadError) return;

          let code = 'unhandled_error';
          let message = msgRaw || 'window_error';
          if (isResourceError) {
            code = 'resource_load_error';
            message = `resource_error:${tagName}`;
          } else {
            const isOpaqueScriptError =
              msgRaw === 'Script error.' &&
              !filename &&
              (lineno === 0 || lineno === null) &&
              (colno === 0 || colno === null) &&
              !stack;

            if (isOpaqueScriptError) {
              // Cross-origin / injected script error without details.
              code = 'script_error_no_details';
            }
          }

          const isOpaqueScriptError = code === 'script_error_no_details';

          // If this is an opaque (detail-less) error, it's very often caused by 3p scripts
          // being blocked/crashing in embedded browsers. These are rarely actionable and
          // can drown out real app errors. We already rate-limit them separately, but
          // additionally ignore if the current page likely has known 3p scripts present.
          // (Still keep non-opaque errors; those contain stack/filename and are actionable.)
          if (isOpaqueScriptError) {
            try {
              const hasKnown3p = (() => {
                try {
                  const scripts = Array.from(document?.scripts || []);
                  for (const s of scripts) {
                    const src = String(s?.src || '').trim();
                    if (!src) continue;
                    const hint = (() => {
                      try {
                        const u = new URL(src, String(window.location?.href || 'https://uniqah.com/'));
                        const host = String(u.host || '').trim();
                        const path = String(u.pathname || '').trim();
                        const v = host ? `${host}${path}` : '';
                        if (!v || v.includes('://') || /[\s\?#@]/.test(v)) return '';
                        return v.slice(0, 420);
                      } catch {
                        return '';
                      }
                    })();
                    if (isKnown3pHostHint(hint)) return true;
                  }
                  return false;
                } catch {
                  return false;
                }
              })();

              const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
              const isInApp = /fbav|fban|instagram|line\//i.test(ua) || /micromessenger|wechat/i.test(ua) || /tiktok|trill/i.test(ua);

              // Heuristic: in-app browsers + known 3p inventory => ignore.
              if (hasKnown3p && isInApp) return;
            } catch {
              // ignore
            }
          }

          const inAppBrowserHint = (() => {
            try {
              const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
              if (!ua) return '';
              if (/fbav|fban/i.test(ua)) return 'facebook';
              if (/instagram/i.test(ua)) return 'instagram';
              if (/line\//i.test(ua)) return 'line';
              if (/micromessenger|wechat/i.test(ua)) return 'wechat';
              if (/tiktok|trill/i.test(ua)) return 'tiktok';
              return '';
            } catch {
              return '';
            }
          })();

          const scriptInventory = (() => {
            try {
              if (!isOpaqueScriptError) return null;
              const scripts = Array.from(document?.scripts || []);
              const out = [];
              const hosts = [];
              const seenHints = new Set();
              const seenHosts = new Set();
              let hasGtag = false;
              let hasTikTok = false;
              let hasGapi = false;

              for (const s of scripts) {
                if (out.length >= 12) break;
                const src = (() => {
                  try {
                    return String(s?.src || '').trim();
                  } catch {
                    return '';
                  }
                })();
                if (!src) continue;

                const hint = (() => {
                  try {
                    const u = new URL(src, String(window.location?.href || 'https://uniqah.com/'));
                    const host = String(u.host || '').trim();
                    const path = String(u.pathname || '').trim();
                    const v = host ? `${host}${path}` : '';
                    if (!v || v.includes('://') || /[\s\?#@]/.test(v)) return '';
                    return v.slice(0, 420);
                  } catch {
                    return '';
                  }
                })();

                if (!hint) continue;
                const k = hint.toLowerCase();
                if (seenHints.has(k)) continue;
                seenHints.add(k);
                out.push(hint);

                try {
                  if (k.includes('googletagmanager.com/gtag/js')) hasGtag = true;
                  if (k.includes('analytics.tiktok.com/i18n/pixel/events.js')) hasTikTok = true;
                  if (k.includes('apis.google.com/js/api.js') || (k.includes('apis.google.com/_/scs/') && k.includes('/js/k=gapi'))) {
                    hasGapi = true;
                  }
                } catch {
                  // ignore
                }

                try {
                  const h = hostHintFromUrlLike(src);
                  const hk = String(h || '').toLowerCase();
                  if (h && !seenHosts.has(hk) && hosts.length < 8) {
                    seenHosts.add(hk);
                    hosts.push(h);
                  }
                } catch {
                  // ignore
                }
              }

              return {
                scriptSrcHints: out,
                scriptHosts: hosts,
                hasGtag,
                hasTikTok,
                hasGapi,
              };
            } catch {
              return null;
            }
          })();

          const opaqueLikelySource = (() => {
            try {
              if (!isOpaqueScriptError) return '';
              const hints = Array.isArray(scriptInventory?.scriptSrcHints) ? scriptInventory.scriptSrcHints : [];
              const low = hints.map((s) => String(s || '').toLowerCase());
              const hasGapi =
                low.some((s) => s.includes('apis.google.com/js/api.js')) ||
                low.some((s) => s.includes('apis.google.com/_/scs/') && s.includes('/js/k=gapi')) ||
                low.some((s) => s.includes('gapi_iframes'));

              if (hasGapi) return 'firebase_auth_gapi_or_recaptcha';
              if (scriptInventory?.hasGtag) return 'gtag_or_google_ads';
              if (scriptInventory?.hasTikTok) return 'tiktok_pixel';
              if (inAppBrowserHint) return 'in_app_browser_injected_or_blocked_3p';
              return '';
            } catch {
              return '';
            }
          })();

          const report = buildSupportReport({
            kind: 'global_window_error',
            flow: 'window.onerror',
            code,
            message,
            extra: {
              filename,
              filenameHint,
              lineno,
              colno,
              stack,
              stackUrlHints,
              errorName,
              errorMessage,
              hasErrorObject,
              eventType,
              eventIsTrusted,
              eventTimeStamp,
              targetType,
              tagName,
              resourceUrl,
              resourceHost,
              resourceUrlHint,
              rel: linkRel,
              as: linkAs,
              isOpaqueScriptError,
              inAppBrowserHint,
              scriptInventory,
              opaqueLikelySource,
              ...getBasicClientMeta(),
            },
          });

          void safeSend(report, { opaque: isOpaqueScriptError });
        } catch {
          // ignore
        }
      },
      { capture: true }
    );

    // CSP blocked script/style/img/connect can cause "site not opening" in some regions/browsers.
    window.addEventListener('securitypolicyviolation', (ev) => {
      try {
        const directive = String(ev?.effectiveDirective || ev?.violatedDirective || '').slice(0, 120);
        const blocked = String(ev?.blockedURI || '').slice(0, 900);
        const srcFile = String(ev?.sourceFile || '').slice(0, 600);
        const lineNumber = typeof ev?.lineNumber === 'number' ? ev.lineNumber : null;
        const columnNumber = typeof ev?.columnNumber === 'number' ? ev.columnNumber : null;

        const blockedHost = hostHintFromUrlLike(blocked);
        const sourceFileHost = hostHintFromUrlLike(srcFile);

        const blockedUrlHint = (() => {
          const s = String(blocked || '').trim();
          if (!s) return '';
          // Common non-URL values for CSP.
          if (s === 'inline' || s === 'eval' || s === 'self') return s;
          if (s.startsWith('data:')) return 'data:';
          if (s.startsWith('blob:')) return 'blob:';
          if (s.startsWith('about:')) return 'about:';

          try {
            const u = new URL(s);
            const host = u.host || '';
            const path = u.pathname || '';
            // Avoid leaking tokens: drop query/hash.
            return host ? `${host}${path}`.slice(0, 420) : '';
          } catch {
            // Best-effort for schemeless input: keep host+path, drop query/hash.
            const noFrag = s.split('#')[0] || '';
            const noQuery = noFrag.split('?')[0] || '';
            return noQuery.slice(0, 420);
          }
        })();

        // Ignore noisy auto-translate/embedded-browser traffic.
        // Some users open the site via Google Translate or have browser translate enabled;
        // those scripts may attempt to send telemetry to translate.googleapis.com which is
        // not required for our app.
        try {
          const dirLow = String(directive || '').toLowerCase();
          const hintLow = String(blockedUrlHint || '').toLowerCase();
          if (dirLow === 'connect-src' && hintLow.includes('translate.googleapis.com/element/log')) {
            return;
          }
        } catch {
          // ignore
        }

        const report = buildSupportReport({
          kind: 'csp_violation',
          flow: 'securitypolicyviolation',
          code: directive || 'csp_violation',
          // Keep message actionable even after server-side URL redaction.
          message: blockedUrlHint || blockedHost || blocked || 'blocked',
          extra: {
            directive,
            blockedURI: blocked,
            blockedHost,
            blockedUrlHint,
            sourceFile: srcFile,
            sourceFileHost,
            lineNumber,
            columnNumber,
            ...getBasicClientMeta(),
          },
        });

        void safeSend(report);
      } catch {
        // ignore
      }
    });

    window.addEventListener('unhandledrejection', (ev) => {
      try {
        const reason = ev?.reason;
        const msg =
          typeof reason?.message === 'string'
            ? String(reason.message)
            : typeof reason === 'string'
              ? reason
              : (() => {
                try {
                  return JSON.stringify(reason);
                } catch {
                  return String(reason || 'unhandled_rejection');
                }
              })();

        const stack = typeof reason?.stack === 'string' ? String(reason.stack).slice(0, 4000) : '';
        const report = buildSupportReport({
          kind: 'global_unhandled_rejection',
          flow: 'window.unhandledrejection',
          code: 'unhandled_rejection',
          message: String(msg || '').slice(0, 800),
          extra: {
            stack,
          },
        });

        void safeSend(report);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

// Service worker dev ortamında (Vite) çok sık cache/refresh sorunlarına ve "beyaz sayfa"ya neden olabiliyor.
// Bu yüzden sadece production build'lerde register ediyoruz.
// Not: `load` event'ini beklemek bazı cihazlarda bildirim/push açma akışını geciktirebiliyor.
if (import.meta.env.PROD && typeof window !== 'undefined') {
  // Defer SW registration to avoid competing with first-load resources on slow networks (mobile/VPN).
  try {
    const doRegister = () => {
      try {
        registerSW({ immediate: true });
      } catch {
        // noop
      }

      // Best-effort: detect installed app and persist it.
      try {
        detectInstalledRelatedAppsAndMark().catch(() => null);
      } catch {
        // ignore
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(doRegister, { timeout: 4000 });
    } else {
      window.setTimeout(doRegister, 2500);
    }
  } catch {
    // ignore
  }

  // PWA install prompt'u route bazında kaçırmamak için global yakala.
  // (Örn: kullanıcı /login veya /evlilik gibi bir sayfadan geldiyse de buton aktif olabilsin.)
  try {
    window.addEventListener('beforeinstallprompt', (e) => {
      try {
        e.preventDefault();
      } catch {
        // ignore
      }

      try {
        window.__uniqahDeferredPrompt = e;
      } catch {
        // ignore
      }
    });

    window.addEventListener('appinstalled', () => {
      try {
        window.__uniqahDeferredPrompt = null;
      } catch {
        // ignore
      }

      try {
        markPwaInstalled();
      } catch {
        // ignore
      }

      try {
        // Best-effort: persist to server (may retry on next login).
        reportPwaInstalledToServerBestEffort({ source: 'appinstalled' }).catch(() => null);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root not found');
}

// Vite HMR bazı durumlarda entry module'u yeniden çalıştırabiliyor.
// Aynı container için birden fazla createRoot() çağrısı React DOM'da "removeChild" NotFoundError üretebiliyor.
const ROOT_KEY = '__EVLILIK_REACT_ROOT__';
const existingRoot = (() => {
  try {
    return import.meta.env.DEV ? window[ROOT_KEY] : null;
  } catch {
    return null;
  }
})();

const root = existingRoot || ReactDOM.createRoot(container);

try {
  if (import.meta.env.DEV) window[ROOT_KEY] = root;
} catch {
  // ignore
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BootstrapApp />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

function BootstrapApp() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    Promise.resolve(i18nReady)
      .catch(() => null)
      .then(() => {
        if (alive) setReady(true);
      });

    // Safety: never get stuck on a blank screen.
    // If i18n fails to init for any reason, render the app anyway after a short timeout.
    const t = window.setTimeout(() => {
      try {
        if (alive) setReady(true);
      } catch {
        // ignore
      }
    }, 3000);
    return () => {
      alive = false;
      try {
        window.clearTimeout(t);
      } catch {
        // ignore
      }
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white/80">
        Yükleniyor…
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-white/80">
          Yükleniyor…
        </div>
      }
    >
      <App />
    </React.Suspense>
  );
}
