import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AnalyticsTracker from './components/AnalyticsTracker';
import PrivateRoute from './components/PrivateRoute';
import { maybeReportDropoffAfterSignupBeforeApply } from './utils/funnelTracker';
import PublicOneTimeTour from './components/tutorial/PublicOneTimeTour.jsx';
import { lazyRoute } from './utils/lazyRoute.js';
import MatchmakingLeadNoAuth from './pages/MatchmakingLeadNoAuth';
import StudioProfile from './pages/studio/StudioProfile';
import StudioMatches from './pages/studio/StudioMatches';
import StudioPool from './pages/studio/StudioPool';

const Home = lazyRoute(() => import('./pages/Home'), 'home');
const About = lazyRoute(() => import('./pages/About'), 'about');
const Corporate = lazyRoute(() => import('./pages/Corporate'), 'corporate');
const Contact = lazyRoute(() => import('./pages/Contact'), 'contact');
const Login = lazyRoute(() => import('./pages/Login'), 'login');
const AppWelcome = lazyRoute(() => import('./pages/AppWelcome'), 'app-welcome');
const AppInstallTutorial = lazyRoute(() => import('./pages/AppInstallTutorial'), 'app-install-tutorial');
const Wedding = lazyRoute(() => import('./pages/Wedding'), 'wedding');
const MatchmakingApply = lazyRoute(() => import('./pages/MatchmakingApply'), 'matchmaking-apply');
const MatchmakingHub = lazyRoute(() => import('./pages/MatchmakingHub'), 'matchmaking-hub');
const MatchmakingMembership = lazyRoute(() => import('./pages/MatchmakingMembership'), 'matchmaking-membership');
const YouTube = lazyRoute(() => import('./pages/YouTube'), 'youtube');
const DocumentsHub = lazyRoute(() => import('./pages/DocumentsHub'), 'documents-hub');
const Privacy = lazyRoute(() => import('./pages/Privacy'), 'privacy');
const NotFound = lazyRoute(() => import('./pages/NotFound'), 'not-found');

// Studio preview is now the same pages in guest mode.
const StudioMyInfo = lazyRoute(() => import('./pages/studio/StudioMyInfo'), 'studio-my-info');
const StudioMessages = lazyRoute(() => import('./pages/studio/StudioMessages'), 'studio-messages');
const StudioNotifications = lazyRoute(() => import('./pages/studio/StudioNotifications'), 'studio-notifications');
const StudioChat = lazyRoute(() => import('./pages/studio/StudioChat'), 'studio-chat');
const StudioMatchProfile = lazyRoute(() => import('./pages/studio/StudioMatchProfile'), 'studio-match-profile');
const StudioFeedback = lazyRoute(() => import('./pages/studio/StudioFeedback'), 'studio-feedback');

const AdminLogin = lazyRoute(() => import('./pages/AdminLogin'), 'admin-login');
const AdminStepUpGate = lazyRoute(() => import('./components/admin/AdminStepUpGate.jsx'), 'admin-step-up-gate');
const AdminDashboard = lazyRoute(() => import('./pages/AdminDashboardLite'), 'admin-dashboard');
const AdminMatchmakingDetail = lazyRoute(() => import('./pages/AdminMatchmakingDetail'), 'admin-matchmaking-detail');
const AdminMatchmakingMatches = lazyRoute(() => import('./pages/AdminMatchmakingMatches'), 'admin-matchmaking-matches');
const AdminMatchmakingPayments = lazyRoute(() => import('./pages/AdminMatchmakingPayments'), 'admin-matchmaking-payments');
const AdminIdentityVerifications = lazyRoute(() => import('./pages/AdminIdentityVerifications'), 'admin-identity-verifications');
const AdminFeedback = lazyRoute(() => import('./pages/AdminFeedback'), 'admin-feedback');
import RequireAuth from './auth/RequireAuth';
import RequireCompletedApplication from './auth/RequireCompletedApplication.jsx';
import RequirePhotoModerationClear from './auth/RequirePhotoModerationClear.jsx';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import { isFeatureEnabled } from './config/siteVariant';
import DevOverlay from './components/DevOverlay';
import { useAuth } from './auth/AuthProvider.jsx';
import { authFetch } from './utils/authFetch.js';
import { clearAppBadge, resetServiceWorkerBadge } from './utils/appBadge.js';
import { startForegroundPushListener, stopForegroundPushListener } from './utils/pushNotifications.js';
import StudioOneTimeTour from './components/tutorial/StudioOneTimeTour.jsx';
import AppReviewPrompt from './components/tutorial/AppReviewPrompt.jsx';
import PreviewGateGlobal from './components/PreviewGateGlobal.jsx';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return null;
}

function NormalizePath() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pathname = String(location?.pathname || '/');
    if (pathname === '/') return;

    // Google/search gibi kaynaklar bazen route'u trailing slash ile açabiliyor (/login/).
    // React Router'da bu 404'e düşebildiği için URL'yi normalize edelim.
    const normalized = pathname.replace(/\/+$/, '');
    if (!normalized || normalized === pathname) return;

    const search = String(location?.search || '');
    const hash = String(location?.hash || '');
    navigate(`${normalized}${search}${hash}`, { replace: true });
  }, [location?.pathname, location?.search, location?.hash, navigate]);

  return null;
}

function TitleManager() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const path = location.pathname || '/';
    const baseUrl = 'https://uniqah.com';

    const setMetaByName = (name, content) => {
      if (!name) return;
      let metaEl = document.querySelector(`meta[name="${name}"]`);
      if (!metaEl) {
        metaEl = document.createElement('meta');
        metaEl.setAttribute('name', name);
        document.head.appendChild(metaEl);
      }
      metaEl.setAttribute('content', String(content ?? ''));
    };

    const canonicalPath = path.startsWith('/') ? path : `/${path}`;
    const canonicalUrl = `${baseUrl}${canonicalPath === '/' ? '/' : canonicalPath}`;

    // Canonical (Google'ın doğru URL'yi kaydetmesi için)
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // OG url (paylaşım ve bazı crawler'lar için)
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }

    // Admin panelde çoklu dil gerekmiyor: title/description TR sabit kalsın.
    if (path.startsWith('/admin')) {
      const baseTr = t('meta.baseTitle', { lng: 'tr' });
      document.title = `Admin Paneli | ${baseTr}`;

      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', 'Admin yönetim paneli.');
      }

      // Admin ekranlarını indeksleme.
      setMetaByName('robots', 'noindex,nofollow');
      return;
    }

    // Auth/uygulama içi sayfalar Google'da görünmesin.
    const isNoIndexPath = (() => {
      // Auth / app içi sayfalar
      if (path === '/login') return true;
      if (path === '/profilim') return true;
      if (path.startsWith('/app/')) return true;
      if (path.startsWith('/studio/')) return true;
      if (path === '/wedding/apply') return true;
      if (path === '/evlilik/eslestirme-basvuru' || path === '/evlilik/eslestirme-basvurusu') return true;

      // Google sonuçlarında görünmesi gerekmeyen vitrin sayfaları
      if (path === '/kurumsal') return true;
      if (path === '/travel' || path.startsWith('/travel/')) return true;
      if (path === '/tours' || path.startsWith('/tours/')) return true;
      if (path === '/explore' || path.startsWith('/explore/')) return true;
      if (path === '/gallery' || path.startsWith('/gallery/')) return true;

      return false;
    })();
    setMetaByName('robots', isNoIndexPath ? 'noindex,nofollow' : 'index,follow');

    const base = t('meta.baseTitle');

    let pageTitle = base;
    let description = t('meta.baseDescription');

    if (path === '/') {
      pageTitle = base;
    } else if (path === '/about') {
      pageTitle = `${t('meta.pages.about.title')} | ${base}`;
    } else if (path === '/kurumsal') {
      pageTitle = `${t('meta.pages.corporate.title')} | ${base}`;
    } else if (path === '/contact') {
      pageTitle = `${t('meta.pages.contact.title')} | ${base}`;
    } else if (
      (path === '/wedding/apply' ||
        path === '/evlilik/eslestirme-basvuru' ||
        path === '/evlilik/eslestirme-basvurusu') &&
      isFeatureEnabled('wedding')
    ) {
      pageTitle = `${t('matchmakingPage.title')} | ${base}`;
      description = t('matchmakingPage.intro');
    } else if (
      (path === '/eslestirme' || path === '/evlilik/eslestirme' || path === '/uniqah' || path === '/evlilik/uniqah') &&
      isFeatureEnabled('wedding')
    ) {
      pageTitle = `${t('matchmakingHub.metaTitle')} | ${base}`;
      description = t('matchmakingHub.description');
    } else if (
      (path === '/wedding' || path === '/evlilik' || path.startsWith('/wedding/')) &&
      isFeatureEnabled('wedding')
    ) {
      pageTitle = `${t('meta.pages.wedding.title')} | ${base}`;
      description = t('meta.pages.wedding.description');
    } else if (path.startsWith('/youtube')) {
      pageTitle = `${t('meta.pages.youtube.title')} | ${base}`;
    } else if (path === '/privacy') {
      pageTitle = `${t('meta.pages.privacy.title')} | ${base}`;
    } else if (path === '/documents') {
      pageTitle = `${t('documentsHub.title')} | ${base}`;
    }

    document.title = pageTitle;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', description);
    }
  }, [i18n.language, location.pathname, t]);

  return null;
}

function StudioBodyClass() {
  const location = useLocation();

  useEffect(() => {
    const path = String(location.pathname || '/');
    const isStudio = path.startsWith('/app/') || path.startsWith('/profilim');
    const cls = 'studio-ui';

    try {
      if (isStudio) document.body.classList.add(cls);
      else document.body.classList.remove(cls);
    } catch {
      // noop
    }

    return () => {
      try {
        document.body.classList.remove(cls);
      } catch {
        // noop
      }
    };
  }, [location.pathname]);

  return null;
}

function AdminLanguageLock() {
  return null;
}

function RouteLoading() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-white/80">
      {t('common.loading')}
    </div>
  );
}

function MatchmakingHeartbeatGlobal() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user?.uid) return;
    if (user?.isAnonymous) return;

    const path = String(location?.pathname || '');
    const isMatchmakingSurface =
      path.startsWith('/eslestirme') ||
      path.startsWith('/evlilik/eslestirme') ||
      path.startsWith('/profilim') ||
      path.startsWith('/app');

    if (!isMatchmakingSurface) return;

    let alive = true;
    let intervalId = null;

    const canPingNow = () => {
      try {
        if (!alive) return false;
        if (document.visibilityState !== 'visible') return false;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
        return true;
      } catch {
        return alive;
      }
    };

    const ping = async () => {
      if (!canPingNow()) return;
      try {
        await authFetch('/api/matchmaking-heartbeat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch {
        // noop
      }
    };

    const onFocus = () => ping();
    const onOnline = () => ping();
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      ping();
    };

    // İlk girişte + odak değişimlerinde lastSeen güncellensin.
    ping();

    try {
      window.addEventListener('focus', onFocus);
      window.addEventListener('online', onOnline);
      document.addEventListener('visibilitychange', onVisibilityChange);
    } catch {
      // noop
    }

    // Çok sık ping atmayalım; sadece "ben buradayım" sinyali.
    intervalId = setInterval(() => {
      if (!alive) return;
      ping();
    }, 5 * 60 * 1000);

    return () => {
      alive = false;
      if (intervalId) clearInterval(intervalId);
      try {
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('online', onOnline);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      } catch {
        // noop
      }
    };
  }, [loading, location?.pathname, user?.uid, user?.isAnonymous]);

  return null;
}

function DeferredMemberFeedToasts() {
  const location = useLocation();
  const [Comp, setComp] = useState(null);

  useEffect(() => {
    const p = String(location?.pathname || '');
    const shouldEnable = !p.startsWith('/admin') && (p.startsWith('/app') || p === '/profilim' || p.startsWith('/profilim/'));
    if (!shouldEnable) return;
    if (Comp) return;

    let cancelled = false;
    const load = () => {
      import('./components/MemberFeedToasts.jsx')
        .then((m) => {
          if (cancelled) return;
          setComp(() => m?.default || null);
        })
        .catch(() => null);
    };

    // First-load friendly: do not compete with route chunk on slow networks.
    let token = null;
    let usedIdle = false;
    try {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        usedIdle = true;
        token = window.requestIdleCallback(load, { timeout: 2500 });
      } else {
        token = window.setTimeout(load, 800);
      }
    } catch {
      token = window.setTimeout(load, 800);
    }

    return () => {
      cancelled = true;
      try {
        if (usedIdle && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(token);
        } else {
          window.clearTimeout(token);
        }
      } catch {
        // noop
      }
    };
  }, [Comp, location?.pathname]);

  if (!Comp) return null;
  return <Comp />;
}

function App() {
  console.log('App component loaded');
  const showWedding = isFeatureEnabled('wedding');
  const { user, loading } = useAuth();

  // If the user opens/focuses the app, clear any missed-notification badge.
  useEffect(() => {
    const clear = async () => {
      await clearAppBadge();
      await resetServiceWorkerBadge();
    };
    const onFocus = () => clear();
    const onVis = () => {
      if (document.visibilityState === 'visible') clear();
    };

    clear();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Foreground push: App açıkken de (özellikle mobilde) bildirim görünür olsun.
  useEffect(() => {
    startForegroundPushListener().catch(() => null);
    return () => {
      stopForegroundPushListener();
    };
  }, []);

  // Funnel: signup tamamlandıktan sonra form doldurmadan ayrılma (drop-off) sinyali.
  useEffect(() => {
    const report = () => {
      try {
        maybeReportDropoffAfterSignupBeforeApply({ page: String(window.location?.pathname || '') });
      } catch {
        // ignore
      }
    };

    const onVis = () => {
      try {
        if (document.visibilityState === 'hidden') report();
      } catch {
        // ignore
      }
    };

    try {
      window.addEventListener('pagehide', report);
      window.addEventListener('beforeunload', report);
      document.addEventListener('visibilitychange', onVis);
    } catch {
      // ignore
    }

    return () => {
      try {
        window.removeEventListener('pagehide', report);
        window.removeEventListener('beforeunload', report);
        document.removeEventListener('visibilitychange', onVis);
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <Router>
      <NormalizePath />
      <ScrollToTop />
      <TitleManager />
      <StudioBodyClass />
      <AdminLanguageLock />
      <AnalyticsTracker />
      <MatchmakingHeartbeatGlobal />
      <FloatingWhatsApp />
      <DeferredMemberFeedToasts />
      <StudioOneTimeTour />
      <AppReviewPrompt />
      <PublicOneTimeTour />
      <PreviewGateGlobal />
      {import.meta.env.DEV ? <DevOverlay /> : null}
      <Suspense
        fallback={<RouteLoading />}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/kurumsal" element={<Corporate />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/uygulama" element={<Navigate to="/app/install" replace />} />
          <Route path="/app" element={<Navigate to="/app/welcome" replace />} />
          <Route path="/app/install" element={<AppInstallTutorial />} />
          <Route path="/app/welcome" element={<AppWelcome />} />
          <Route
            path="/profilim"
            element={
              <RequireAuth>
                <StudioProfile />
              </RequireAuth>
            }
          />

          <Route path="/profilim-onizleme" element={<Navigate to="/profilim" replace />} />
          <Route
            path="/profilim/destek"
            element={
              <RequireAuth>
                <StudioFeedback />
              </RequireAuth>
            }
          />
          <Route
            path="/profilim/bilgilerim"
            element={
              <RequireAuth>
                <RequireCompletedApplication>
                  <StudioMyInfo />
                </RequireCompletedApplication>
              </RequireAuth>
            }
          />
          <Route
            path="/profilim-eski"
            element={<Navigate to="/profilim" replace />}
          />
          <Route path="/panel" element={<Navigate to="/profilim" replace />} />

          {/* Studio UI (matchmaking) */}
          <Route
            path="/app/matches"
            element={
              <RequireAuth>
                <RequirePhotoModerationClear>
                  <StudioMatches />
                </RequirePhotoModerationClear>
              </RequireAuth>
            }
          />
          <Route
            path="/app/pool"
            element={
              <RequireAuth>
                <RequirePhotoModerationClear>
                  <StudioPool />
                </RequirePhotoModerationClear>
              </RequireAuth>
            }
          />
          <Route
            path="/app/messages"
            element={
              <RequireAuth>
                <RequirePhotoModerationClear>
                  <StudioMessages />
                </RequirePhotoModerationClear>
              </RequireAuth>
            }
          />
          <Route
            path="/app/notifications"
            element={
              <RequireAuth>
                <RequirePhotoModerationClear>
                  <StudioNotifications />
                </RequirePhotoModerationClear>
              </RequireAuth>
            }
          />
          <Route
            path="/app/match/:matchId"
            element={
              <RequireAuth>
                <RequirePhotoModerationClear>
                  <StudioMatchProfile />
                </RequirePhotoModerationClear>
              </RequireAuth>
            }
          />
          <Route
            path="/app/chat/:matchId"
            element={
              <RequireAuth>
                <RequirePhotoModerationClear>
                  <StudioChat />
                </RequirePhotoModerationClear>
              </RequireAuth>
            }
          />
          {showWedding && <Route path="/wedding" element={<Wedding />} />}
          {showWedding && <Route path="/wedding/app/:tab" element={<Wedding />} />}
          {showWedding && <Route path="/eslestirme" element={<MatchmakingHub />} />}
          <Route
            path="/wedding/apply"
            element={
              <RequireAuth>
                <MatchmakingApply />
              </RequireAuth>
            }
          />

          {/* Legacy routes -> Matchmaking hub */}
          {showWedding && <Route path="/uniqah" element={<Navigate to="/eslestirme" replace />} />}

          {/* Google Ads / TR alias URL'ler */}
          {isFeatureEnabled('wedding') && <Route path="/evlilik" element={<Wedding />} />}
          {isFeatureEnabled('wedding') && <Route path="/evlilik/app/:tab" element={<Wedding />} />}
          {isFeatureEnabled('wedding') && <Route path="/evlilik/eslestirme" element={<MatchmakingHub />} />}
          {isFeatureEnabled('wedding') && (
            <Route path="/evlilik/uniqah" element={<Navigate to="/evlilik/eslestirme" replace />} />
          )}
          <Route
            path="/evlilik/eslestirme-basvuru"
            element={
              <RequireAuth>
                <MatchmakingApply />
              </RequireAuth>
            }
          />
          <Route
            path="/evlilik/eslestirme-basvurusu"
            element={
              <RequireAuth>
                <MatchmakingApply />
              </RequireAuth>
            }
          />

          {isFeatureEnabled('wedding') && (
            <Route
              path="/evlilik/uyelik"
              element={
                <RequireAuth>
                  <MatchmakingMembership />
                </RequireAuth>
              }
            />
          )}
          <Route path="/youtube" element={<YouTube />} />
          <Route path="/documents" element={<DocumentsHub />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route path="/aracilik" element={<MatchmakingLeadNoAuth />} />
          <Route path="/evlilik/aracilik-basvurusu" element={<Navigate to="/aracilik" replace />} />

          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <AdminStepUpGate>
                  <AdminDashboard />
                </AdminStepUpGate>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/matchmaking/:id"
            element={
              <PrivateRoute>
                <AdminStepUpGate>
                  <AdminMatchmakingDetail />
                </AdminStepUpGate>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/matchmaking-matches"
            element={
              <PrivateRoute>
                <AdminStepUpGate>
                  <AdminMatchmakingMatches />
                </AdminStepUpGate>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/matchmaking-payments"
            element={
              <PrivateRoute>
                <AdminStepUpGate>
                  <AdminMatchmakingPayments />
                </AdminStepUpGate>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/identity-verifications"
            element={
              <PrivateRoute>
                <AdminStepUpGate>
                  <AdminIdentityVerifications />
                </AdminStepUpGate>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/feedback"
            element={
              <PrivateRoute>
                <AdminStepUpGate>
                  <AdminFeedback />
                </AdminStepUpGate>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/reviews"
            element={
              <PrivateRoute>
                <AdminStepUpGate>
                  <AdminFeedback defaultViewMode="reviews" />
                </AdminStepUpGate>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
