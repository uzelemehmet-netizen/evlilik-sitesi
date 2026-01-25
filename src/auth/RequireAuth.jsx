import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isPublicPath = (pathname) => {
    const path = String(pathname || '/');

    // Exact public pages
    if (
      path === '/' ||
      path === '/about' ||
      path === '/kurumsal' ||
      path === '/contact' ||
      path === '/login' ||
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
      path.startsWith('/travel') ||
      path.startsWith('/tours') ||
      path.startsWith('/kesfet') ||
      path.startsWith('/youtube') ||
      path.startsWith('/gallery') ||
      path.startsWith('/dokumanlar') ||
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
          from: location.pathname,
          fromState: location.state || null,
        }}
      />
    );
  }


  return children;
}
