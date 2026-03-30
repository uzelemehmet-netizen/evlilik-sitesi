import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseAuth';
import { authFetch } from '../utils/authFetch';
import { isPwaInstalled, reportPwaInstalledToServerBestEffort, wantsReportPwaInstalledToServer } from '../utils/pwaInstalled.js';
import { AuthContext } from './AuthProvider.jsx';

function dayKeyUTC(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        // ignore
      }
    })();
  }, [user]);

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
  }, [user]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}