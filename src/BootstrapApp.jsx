import React from 'react';
import App from './App.jsx';
import { i18nReady } from './i18n';

export default function BootstrapApp() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    Promise.resolve(i18nReady)
      .catch(() => null)
      .then(() => {
        if (alive) setReady(true);
      });

    const timeoutId = window.setTimeout(() => {
      try {
        if (alive) setReady(true);
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      alive = false;
      try {
        window.clearTimeout(timeoutId);
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