import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../config/firebase';

export default function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  const ruleAdmins = ["uzelemehmet@gmail.com", "articelikkapi@gmail.com"];
  const ruleAdminSet = new Set(ruleAdmins);

  const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  // Firestore rules ile birebir uyum: sadece kural listesinde olanlar admin sayılır.
  // Eğer env listesi verilmişse, kural listesiyle kesişim alınır.
  const effectiveAdmins = envAdmins.length > 0
    ? envAdmins.filter((email) => ruleAdminSet.has(email))
    : ruleAdmins;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const email = String(user.email || "").toLowerCase();
      // Admin panel: sadece allowlist + email/şifre (password provider) ile giriş.
      // Böylece Google login açık olsa bile admin panelde kullanılmaz.
      const providers = Array.isArray(user?.providerData) ? user.providerData.map((p) => String(p?.providerId || '')) : [];
      const hasPasswordProvider = providers.includes('password');
      setIsAdmin(effectiveAdmins.includes(email) && hasPasswordProvider);
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
