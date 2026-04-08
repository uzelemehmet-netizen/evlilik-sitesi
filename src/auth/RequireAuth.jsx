import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const normalizePath = (pathname) => {
    const rawPath = String(pathname || '/');
    return rawPath.replace(/\/+$/, '') || '/';
  };

  const getAuthModeForPath = (pathname) => {
    const path = normalizePath(pathname);
    // Bu sayfalar “kayıt ol -> form doldur” akışının bir parçası.
    // Direkt login yerine signup ekranını açmak daha doğru.
    if (
      path === '/wedding/apply' ||
      path === '/evlilik/eslestirme-basvuru' ||
      path === '/evlilik/eslestirme-basvurusu' ||
      path === '/evlilik/uyelik'
    ) {
      return 'signup';
    }
    return 'login';
  };

  const isAppShellPath = (pathname) => {
    const path = normalizePath(pathname);
    return path === '/profilim' || path.startsWith('/profilim/') || path.startsWith('/app/');
  };

  const isPublicPath = (pathname) => {
    const path = normalizePath(pathname);

    if (path === '/app' || path === '/app/welcome' || path === '/app/install') {
      return true;
    }

    // Explicit protected pages that live under otherwise-public prefixes.
    // These must require a real (non-anonymous) authenticated user.
    if (
      path === '/wedding/apply' ||
      path === '/evlilik/eslestirme-basvuru' ||
      path === '/evlilik/eslestirme-basvurusu' ||
      path === '/evlilik/uyelik'
    ) {
      return false;
    }

    // Exact public pages
    if (
      path === '/' ||
      path === '/about' ||
      path === '/kurumsal' ||
      path === '/contact' ||
      path === '/login' ||
      path === '/documents' ||
      path === '/privacy'
    ) {
      return true;
    }

    // Prefix-based public pages
    return (
      path.startsWith('/wedding') ||
      path.startsWith('/evlilik') ||
      path.startsWith('/uniqah') ||
      path.startsWith('/eslestirme') ||
      path.startsWith('/youtube') ||
      path.startsWith('/docs/')
    );
  };

  if (loading) {
    // Eğer RequireAuth yanlışlıkla public sayfalara da uygulanırsa,
    // kullanıcıyı gereksiz yere "loading" ekranında bekletmeyelim.
    if (isPublicPath(location.pathname)) return children;
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!user || user.isAnonymous) {
    if (isPublicPath(location.pathname)) return children;

    if (isAppShellPath(location.pathname)) {
      return (
        <Navigate
          to="/app/welcome"
          replace
          state={{
            from: `${location.pathname || ''}${location.search || ''}`,
            fromState: location.state || null,
          }}
        />
      );
    }

    const mode = getAuthModeForPath(location.pathname);
    return (
      <Navigate
        to={`/login?mode=${mode}`}
        replace
        state={{
          from: `${location.pathname || ''}${location.search || ''}`,
          fromState: location.state || null,
        }}
      />
    );
  }


  return children;
}
