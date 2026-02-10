import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isPublicPath = (pathname) => {
    const rawPath = String(pathname || '/');
    const path = rawPath.replace(/\/+$/, '') || '/';

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
    return (
      <Navigate
        to="/login"
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
