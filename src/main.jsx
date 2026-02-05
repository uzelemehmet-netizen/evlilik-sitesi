import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n';
import { AuthProvider } from './auth/AuthProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { registerSW } from 'virtual:pwa-register';

// Service worker dev ortamında (Vite) çok sık cache/refresh sorunlarına ve "beyaz sayfa"ya neden olabiliyor.
// Bu yüzden sadece production build'lerde register ediyoruz.
// Not: `load` event'ini beklemek bazı cihazlarda bildirim/push açma akışını geciktirebiliyor.
if (import.meta.env.PROD && typeof window !== 'undefined') {
  try {
    registerSW({ immediate: true });
  } catch {
    // noop
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
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
