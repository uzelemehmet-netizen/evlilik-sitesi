import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebaseAuth";
import { authFetch } from "../utils/authFetch";
import { isPwaInstalled, reportPwaInstalledToServerBestEffort, wantsReportPwaInstalledToServer } from '../utils/pwaInstalled.js';

function dayKeyUTC(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fast path: if Firebase already has a currentUser (e.g., right after redirect/popup return),
    // surface it immediately so guards/navigation don't bounce back to /login.
    try {
      const cur = auth?.currentUser || null;
      if (cur) {
        setUser(cur);
        setLoading(false);
      }
    } catch {
      // ignore
    }

    const safety = setTimeout(() => {
      setLoading(false);
      // eslint-disable-next-line no-console
      console.warn('[auth] onAuthStateChanged timeout; forcing loading=false');
    }, 7000);

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser || null);
      setLoading(false);
      clearTimeout(safety);
    });

    return () => {
      clearTimeout(safety);
      unsubscribe();
    };
  }, []);

  // Public join ping (for realtime "new members" widget). Best-effort + localStorage throttle.
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    const today = dayKeyUTC();
    const key = 'publicJoinPingDayKey';
    try {
      const last = String(localStorage.getItem(key) || '').trim();
      if (last === today) return;
    } catch {
      // ignore
    }

    (async () => {
      try {
        await authFetch('/api/public-join-ping', { method: 'POST' });
        try {
          localStorage.setItem(key, today);
        } catch {
          // ignore
        }
      } catch {
        // ignore (should never block UX)
      }
    })();
  }, [user?.uid]);

  // Best-effort: persist PWA install signal to server for admin segmentation.
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    try {
      const shouldTry = wantsReportPwaInstalledToServer() || isPwaInstalled();
      if (!shouldTry) return;
    } catch {
      return;
    }

    (async () => {
      try {
        await reportPwaInstalledToServerBestEffort({ source: 'auth_login', uid: user.uid });
      } catch {
        // ignore
      }
    })();
  }, [user?.uid]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
