import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AnalyticsTracker from './components/AnalyticsTracker';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import About from './pages/About';
import Corporate from './pages/Corporate';
import Contact from './pages/Contact';
import Travel from './pages/Travel';
import Tours from './pages/Tours';
import GroupTours from './pages/GroupTours';
import TourDetail from './pages/TourDetail';
import Payment from './pages/Payment';
import Login from './pages/Login';
import Panel from './pages/Panel';
import ReservationsPanel from './pages/ReservationsPanel';
import Wedding from './pages/Wedding';
import MatchmakingApply from './pages/MatchmakingApply';
import MatchmakingHub from './pages/MatchmakingHub';
import MatchmakingMembership from './pages/MatchmakingMembership';
import YouTube from './pages/YouTube';
import Privacy from './pages/Privacy';
import Kesfet from './pages/Kesfet';
import KesfetIsland from './pages/KesfetIsland';
import { DestinationDetailPage as KesfetDestination } from './pages/KesfetDestination';
import Gallery from './pages/Gallery';
import DocumentsHub from './pages/DocumentsHub';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminMatchmakingDetail from './pages/AdminMatchmakingDetail';
import AdminMatchmakingMatches from './pages/AdminMatchmakingMatches';
import AdminMatchmakingPayments from './pages/AdminMatchmakingPayments';
import AdminIdentityVerifications from './pages/AdminIdentityVerifications';
import NotFound from './pages/NotFound';
import RequireAuth from './auth/RequireAuth';
import { useAuth } from './auth/AuthProvider';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import { isFeatureEnabled } from './config/siteVariant';

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
    } else if (path.startsWith('/tours')) {
      pageTitle = `${t('meta.pages.tours.title')} | ${base}`;
      description = t('meta.pages.tours.description');
    } else if (path.startsWith('/travel')) {
      pageTitle = `${t('meta.pages.travel.title')} | ${base}`;
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
    } else if (path.startsWith('/kesfet')) {
      pageTitle = `${t('meta.pages.explore.title')} | ${base}`;
    } else if (path.startsWith('/youtube')) {
      pageTitle = `${t('meta.pages.youtube.title')} | ${base}`;
    } else if (path.startsWith('/gallery')) {
      pageTitle = `${t('meta.pages.gallery.title')} | ${base}`;
    } else if (path === '/privacy') {
      pageTitle = `${t('meta.pages.privacy.title')} | ${base}`;
    } else if (path.startsWith('/dokumanlar')) {
      pageTitle = `${t('meta.pages.documents.title')} | ${base}`;
    }

    document.title = pageTitle;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', description);
    }
  }, [i18n.language, location.pathname, t]);

  return null;
}

function SiteAuthGate({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const path = location.pathname || '/';

  const allowUnauthed = path.startsWith('/login') || path.startsWith('/admin');
  if (allowUnauthed) return children;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!user || user.isAnonymous) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: path,
          fromState: location.state || null,
        }}
      />
    );
  }

  return children;
}

function App() {
  console.log('App component loaded');
  const showTravel = isFeatureEnabled('travel');
  const showWedding = isFeatureEnabled('wedding');
  const isWeddingOnly = showWedding && !showTravel;
  const showDocuments = isFeatureEnabled('documents');

  return (
    <Router>
      <ScrollToTop />
      <TitleManager />
      <AnalyticsTracker />
      <FloatingWhatsApp />
      <SiteAuthGate>
      <Routes>
        <Route path="/" element={isWeddingOnly ? <Wedding /> : <Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/kurumsal" element={<Corporate />} />
        <Route path="/contact" element={<Contact />} />
        {showTravel && <Route path="/travel" element={<Travel />} />}
        {showDocuments && <Route path="/dokumanlar" element={<DocumentsHub />} />}
        {isFeatureEnabled('tours') && <Route path="/tours" element={<Tours />} />}
        {isFeatureEnabled('tours') && <Route path="/tours/groups" element={<GroupTours />} />}
        {isFeatureEnabled('tours') && <Route path="/tours/:id" element={<TourDetail />} />}
        <Route path="/login" element={<Login />} />
        <Route
          path="/profilim"
          element={
            <RequireAuth>
              <Panel />
            </RequireAuth>
          }
        />
        <Route path="/panel" element={<Navigate to="/profilim" replace />} />
        <Route
          path="/rezervasyonlar"
          element={
            <RequireAuth>
              <ReservationsPanel />
            </RequireAuth>
          }
        />
        <Route
          path="/payment"
          element={
            <RequireAuth>
              <Payment />
            </RequireAuth>
          }
        />
        <Route path="/gallery" element={<Gallery />} />
        {isFeatureEnabled('explore') && <Route path="/kesfet" element={<Kesfet />} />}
        {isFeatureEnabled('explore') && <Route path="/kesfet/:island" element={<KesfetIsland />} />}
        {isFeatureEnabled('explore') && <Route path="/kesfet/:island/:destination" element={<KesfetDestination />} />}

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
      </SiteAuthGate>
    </Router>
  );
}

export default App;
