import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!user || user.isAnonymous) {
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
