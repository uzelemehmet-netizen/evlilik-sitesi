import React from 'react';
import i18n from '../i18n.js';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[app] Uncaught render error', error, info);
    try {
      this.setState({ info });
    } catch {
      // ignore
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Dev HMR sonrası: hata düzeldiyse beyaz ekranda takılı kalmasın.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
      return;
    }

    // İlk kez hata ekranına düşüldüyse ve bu bir chunk/SW hatasına benziyorsa,
    // SW + cache temizleyip otomatik reload deneriz (session başına 1 kez).
    if (!prevState?.hasError && this.state.hasError) {
      try {
        const msg = this.getErrorMessage();
        if (this.isLikelyChunkLoadError(msg)) {
          const key = '__uniqah_auto_repair_attempted__';
          const attempted = (() => {
            try {
              return sessionStorage.getItem(key) === '1';
            } catch {
              return false;
            }
          })();
          if (!attempted) {
            try {
              sessionStorage.setItem(key, '1');
            } catch {
              // ignore
            }
            this.hardReload({ reason: 'chunk_load_error_auto' });
          }
        }
      } catch {
        // ignore
      }
    }
  }

  reset = () => {
    try {
      this.setState({ hasError: false, error: null, info: null });
    } catch {
      // ignore
    }
  };

  getErrorMessage = () => {
    const e = this.state.error;
    if (!e) return '';
    if (typeof e === 'string') return e;
    if (typeof e?.message === 'string') return e.message;
    try {
      return String(e);
    } catch {
      return '';
    }
  };

  isLikelyChunkLoadError = (msg) => {
    const s = String(msg || '').toLowerCase();
    if (!s) return false;
    return (
      s.includes('loading chunk') ||
      s.includes('chunkloaderror') ||
      s.includes('failed to fetch dynamically imported module') ||
      s.includes('importing a module script failed') ||
      s.includes('dynamically imported module') ||
      s.includes('cannot find module') ||
      s.includes('unexpected token <')
    );
  };

  hardReload = async ({ reason } = {}) => {
    try {
      // Service worker unregister (PWA cache mismatch'i çözmek için)
      if (typeof navigator !== 'undefined' && navigator.serviceWorker?.getRegistrations) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            regs.map((r) => {
              try {
                return r.unregister();
              } catch {
                return false;
              }
            })
          );
        } catch {
          // ignore
        }
      }

      // Cache API temizle
      if (typeof caches !== 'undefined' && caches?.keys) {
        try {
          const keys = await caches.keys();
          await Promise.all(
            keys.map((k) => {
              try {
                return caches.delete(k);
              } catch {
                return false;
              }
            })
          );
        } catch {
          // ignore
        }
      }

      // Cache-buster ile yeniden yükle (CDN/HTTP cache'in eski index'i servis etmesini azaltır)
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('__reload', String(Date.now()));
        if (reason) url.searchParams.set('__reason', String(reason));
        window.location.replace(url.toString());
        return;
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }

    // Son çare
    try {
      window.location.reload();
    } catch {
      // ignore
    }
  };

  handleReload = () => {
    this.hardReload({ reason: 'user_clicked_reload' });
  };

  render() {
    if (this.state.hasError) {
      const isDev = (() => {
        try {
          return !!import.meta?.env?.DEV;
        } catch {
          return false;
        }
      })();

      const t = (key, vars) => {
        try {
          return i18n.t(key, vars);
        } catch {
          return key;
        }
      };

      const errMsg = this.getErrorMessage();

      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('appErrorBoundary.title')}</h1>
            <p className="text-sm text-gray-600 mb-6">{t('appErrorBoundary.body')}</p>

            {isDev && errMsg ? (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-left text-xs text-gray-700 whitespace-pre-wrap">
                {errMsg}
              </div>
            ) : null}

            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center justify-center bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-950 transition text-sm"
            >
              {t('appErrorBoundary.tryAgain')}
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className="ml-2 inline-flex items-center justify-center bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition text-sm"
            >
              {t('appErrorBoundary.reload')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
