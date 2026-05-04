import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../config/firebaseAuth';
import { getAdminAccessState } from '../utils/adminAccess';

export default function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (cancelled) return;

      setIsAuthenticated(!!user);

      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const access = await getAdminAccessState(user);
        if (!cancelled) setIsAdmin(access.isAdmin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
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
