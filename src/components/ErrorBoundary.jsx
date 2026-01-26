import React from 'react';

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

  componentDidUpdate(prevProps) {
    // Dev HMR sonrası: hata düzeldiyse beyaz ekranda takılı kalmasın.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  reset = () => {
    try {
      this.setState({ hasError: false, error: null, info: null });
    } catch {
      // ignore
    }
  };

  handleReload = () => {
    try {
      window.location.reload();
    } catch {
      // ignore
    }
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

      const errMsg = (() => {
        const e = this.state.error;
        if (!e) return '';
        if (typeof e === 'string') return e;
        if (typeof e?.message === 'string') return e.message;
        try {
          return String(e);
        } catch {
          return '';
        }
      })();

      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Bir hata oluştu</h1>
            <p className="text-sm text-gray-600 mb-6">
              Sayfa yüklenemedi. Lütfen yenilemeyi deneyin.
            </p>

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
              Yeniden dene
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className="ml-2 inline-flex items-center justify-center bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition text-sm"
            >
              Sayfayı yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
