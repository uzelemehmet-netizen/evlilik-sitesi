import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getPhotoModerationRestriction } from '../utils/photoModerationState';

let firestoreApiPromise = null;

async function loadFirestoreApi() {
  if (!firestoreApiPromise) {
    firestoreApiPromise = Promise.all([import('../config/firebaseDb'), import('firebase/firestore')]).then(([dbMod, fs]) => {
      const db = dbMod?.db || dbMod?.default;
      return { db, ...fs };
    });
  }
  return firestoreApiPromise;
}

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export default function RequirePhotoModerationClear({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [state, setState] = useState({ loading: true, blocked: false });

  useEffect(() => {
    if (loading) return;

    const uid = safeStr(user?.uid);
    if (!uid || user?.isAnonymous) {
      setState({ loading: false, blocked: false });
      return;
    }

    let alive = true;
    setState({ loading: true, blocked: false });

    let stop = null;

    (async () => {
      try {
        const { db, doc, onSnapshot } = await loadFirestoreApi();
        if (!alive) return;
        stop = onSnapshot(
          doc(db, 'matchmakingUsers', uid),
          (snap) => {
            if (!alive) return;
            const data = snap.exists() ? snap.data() || {} : {};
            setState({ loading: false, blocked: getPhotoModerationRestriction(data).active });
          },
          () => {
            if (!alive) return;
            setState({ loading: false, blocked: false });
          },
        );
      } catch {
        if (!alive) return;
        setState({ loading: false, blocked: false });
      }
    })();

    return () => {
      alive = false;
      try {
        if (typeof stop === 'function') stop();
      } catch {
        // ignore
      }
    };
  }, [loading, user?.isAnonymous, user?.uid]);

  if (state.loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (state.blocked) {
    return (
      <Navigate
        to="/profilim"
        replace
        state={{
          openPhotoManager: true,
          profileGate: 'photo_review_required',
          from: `${location?.pathname || ''}${location?.search || ''}`,
        }}
      />
    );
  }

  return children;
}