import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n';
import { AuthProvider } from './auth/AuthProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

console.log('main.jsx loaded');

// Service worker dev ortamında (Vite) çok sık cache/refresh sorunlarına ve "beyaz sayfa"ya neden olabiliyor.
// Bu yüzden sadece production build'lerde register ediyoruz.
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // noop
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
