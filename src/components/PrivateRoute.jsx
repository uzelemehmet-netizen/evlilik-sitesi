import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../config/firebase';

export default function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  const ADMIN_EMAIL = 'uzelemehmet@gmail.com';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const email = String(user.email || "").toLowerCase();
      // Admin panel: sadece email/şifre (password provider) ile giriş.
      // Böylece Google login açık olsa bile admin panelde kullanılmaz.
      const providers = Array.isArray(user?.providerData) ? user.providerData.map((p) => String(p?.providerId || '')) : [];
      const hasPasswordProvider = providers.includes('password');

      setIsAdmin(!!hasPasswordProvider && !!email && email === ADMIN_EMAIL);
    });

    return unsubscribe;
  }, []);

  if (isAuthenticated === null || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
