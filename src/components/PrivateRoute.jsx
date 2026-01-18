import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../config/firebase';

export default function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  const defaultAdmins = ["uzelemehmet@gmail.com", "articelikkapi@gmail.com"];

  const allowedAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);

      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Eğer allowlist tanımlıysa, sadece listedekiler admin sayılır.
      if (allowedAdminEmails.length > 0) {
        setIsAdmin(allowedAdminEmails.includes(String(user.email || "").toLowerCase()));
      } else {
        // Varsayılan: sadece belirlenen admin e-postaları.
        setIsAdmin(defaultAdmins.includes(String(user.email || "").toLowerCase()));
      }
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
