import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AnalyticsTracker from './components/AnalyticsTracker';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import About from './pages/About';
import Corporate from './pages/Corporate';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Panel from './pages/Panel';
import StudioProfile from './pages/studio/StudioProfile';
import StudioMyInfo from './pages/studio/StudioMyInfo';
import StudioMatches from './pages/studio/StudioMatches';
import StudioChat from './pages/studio/StudioChat';
import StudioMatchProfile from './pages/studio/StudioMatchProfile';
import Wedding from './pages/Wedding';
import MatchmakingApply from './pages/MatchmakingApply';
import MatchmakingHub from './pages/MatchmakingHub';
import MatchmakingMembership from './pages/MatchmakingMembership';
import YouTube from './pages/YouTube';
import Privacy from './pages/Privacy';
import Gallery from './pages/Gallery';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminMatchmakingDetail from './pages/AdminMatchmakingDetail';
import AdminMatchmakingMatches from './pages/AdminMatchmakingMatches';
import AdminMatchmakingPayments from './pages/AdminMatchmakingPayments';
import AdminIdentityVerifications from './pages/AdminIdentityVerifications';
import NotFound from './pages/NotFound';
import RequireAuth from './auth/RequireAuth';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import { isFeatureEnabled } from './config/siteVariant';
import DevOverlay from './components/DevOverlay';
import { useAuth } from './auth/AuthProvider.jsx';
import { authFetch } from './utils/authFetch.js';

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

function TitleManager() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const path = location.pathname || '/';

    // Admin panelde çoklu dil gerekmiyor: title/description TR sabit kalsın.
    if (path.startsWith('/admin')) {
      const baseTr = t('meta.baseTitle', { lng: 'tr' });
      document.title = `Admin Paneli | ${baseTr}`;

      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', 'Admin yönetim paneli.');
      }
      return;
    }

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
      (path === '/uniqah' || path === '/evlilik/uniqah') &&
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
    } else if (path.startsWith('/gallery')) {
      pageTitle = `${t('meta.pages.gallery.title')} | ${base}`;
    } else if (path === '/privacy') {
      pageTitle = `${t('meta.pages.privacy.title')} | ${base}`;
    }

    document.title = pageTitle;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', description);
    }
  }, [i18n.language, location.pathname, t]);

  return null;
}

function MatchmakingHeartbeatGlobal() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user?.uid) return;
    if (user?.isAnonymous) return;

    let alive = true;

    const ping = async () => {
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

    // İlk girişte + odak değişimlerinde lastSeen güncellensin.
    ping();

    try {
      window.addEventListener('focus', onFocus);
    } catch {
      // noop
    }

    // Çok sık ping atmayalım; sadece "ben buradayım" sinyali.
    const interval = setInterval(() => {
      if (!alive) return;
      ping();
    }, 5 * 60 * 1000);

    return () => {
      alive = false;
      clearInterval(interval);
      try {
        window.removeEventListener('focus', onFocus);
      } catch {
        // noop
      }
    };
  }, [loading, user?.uid, user?.isAnonymous]);

  return null;
}

function App() {
  console.log('App component loaded');
  const showWedding = isFeatureEnabled('wedding');
  const isWeddingOnly = showWedding;

  return (
    <Router>
      <ScrollToTop />
      <TitleManager />
      <AnalyticsTracker />
      <MatchmakingHeartbeatGlobal />
      <FloatingWhatsApp />
      {import.meta.env.DEV ? <DevOverlay /> : null}
      <Routes>
        <Route path="/" element={isWeddingOnly ? <Wedding /> : <Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/kurumsal" element={<Corporate />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profilim"
          element={
            <RequireAuth>
              <StudioProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/profilim/bilgilerim"
          element={
            <RequireAuth>
              <StudioMyInfo />
            </RequireAuth>
          }
        />
        <Route
          path="/profilim-eski"
          element={
            <RequireAuth>
              <Panel />
            </RequireAuth>
          }
        />
        <Route path="/panel" element={<Navigate to="/profilim" replace />} />

        {/* Studio UI (matchmaking) */}
        <Route
          path="/app/matches"
          element={
            <RequireAuth>
              <StudioMatches />
            </RequireAuth>
          }
        />
        <Route
          path="/app/match/:matchId"
          element={
            <RequireAuth>
              <StudioMatchProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/app/chat/:matchId"
          element={
            <RequireAuth>
              <StudioChat />
            </RequireAuth>
          }
        />
        <Route path="/gallery" element={<Gallery />} />

        {showWedding && <Route path="/wedding" element={<Wedding />} />}
        {showWedding && <Route path="/uniqah" element={<MatchmakingHub />} />}
        {isFeatureEnabled('wedding') && (
          <Route
            path="/wedding/apply"
            element={
              <RequireAuth>
                <MatchmakingApply />
              </RequireAuth>
            }
          />
        )}

        {/* Legacy routes -> Uniqah */}
        {showWedding && <Route path="/eslestirme" element={<Navigate to="/uniqah" replace />} />}

        {/* Google Ads / TR alias URL'ler */}
        {isFeatureEnabled('wedding') && <Route path="/evlilik" element={<Wedding />} />}
        {isFeatureEnabled('wedding') && <Route path="/evlilik/uniqah" element={<MatchmakingHub />} />}
        {isFeatureEnabled('wedding') && (
          <Route path="/evlilik/eslestirme" element={<Navigate to="/evlilik/uniqah" replace />} />
        )}
        {isFeatureEnabled('wedding') && (
          <Route
            path="/evlilik/eslestirme-basvuru"
            element={
              <RequireAuth>
                <MatchmakingApply />
              </RequireAuth>
            }
          />
        )}
        {isFeatureEnabled('wedding') && (
          <Route
            path="/evlilik/eslestirme-basvurusu"
            element={
              <RequireAuth>
                <MatchmakingApply />
              </RequireAuth>
            }
          />
        )}

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
        <Route path="/privacy" element={<Privacy />} />

        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/matchmaking/:id"
          element={
            <PrivateRoute>
              <AdminMatchmakingDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/matchmaking-matches"
          element={
            <PrivateRoute>
              <AdminMatchmakingMatches />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/matchmaking-payments"
          element={
            <PrivateRoute>
              <AdminMatchmakingPayments />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/identity-verifications"
          element={
            <PrivateRoute>
              <AdminIdentityVerifications />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
