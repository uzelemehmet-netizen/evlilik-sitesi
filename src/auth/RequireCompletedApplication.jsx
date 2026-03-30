import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import {
  getMatchmakingProfileGateStateFromApp,
  hasMinimumMatchmakingProfileInApplicationDoc,
  hasMinimumMatchmakingProfileInUserDoc,
  isStubMatchmakingApplication,
} from '../utils/matchmakingProfileCompletion';

let firestoreApiPromise = null;
async function loadFirestoreApi() {
  if (!firestoreApiPromise) {
    firestoreApiPromise = Promise.all([
      import('../config/firebaseDb'),
      import('firebase/firestore'),
    ]).then(([dbMod, fs]) => {
      const db = dbMod?.db || dbMod?.default;
      return { db, ...fs };
    });
  }
  return firestoreApiPromise;
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizePath(pathname) {
  const raw = String(pathname || '/');
  return raw.replace(/\/+$/, '') || '/';
}

function hasMinimumProfileInUserDoc(d) {
  return hasMinimumMatchmakingProfileInUserDoc(d);
}

function hasMinimumProfileInApplicationDoc(a) {
  return hasMinimumMatchmakingProfileInApplicationDoc(a);
}

async function getProfileCompletionState(uid) {
  const userId = safeStr(uid);
  if (!userId) return { ok: false, reason: 'application_required' };

  const { db, collection, doc, getDoc, getDocs, limit, query, where } = await loadFirestoreApi();

  // Fast path: matchmakingUsers minimum profile fields.
  try {
    const uRef = doc(db, 'matchmakingUsers', userId);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists()) {
      const d = uSnap.data() || {};
      if (hasMinimumProfileInUserDoc(d)) return { ok: true, reason: 'complete' };
    }
  } catch {
    // ignore and fall back
  }

  // Fallback: matchmakingApplications, non-stub.
  try {
    const q1 = query(collection(db, 'matchmakingApplications'), where('userId', '==', userId), limit(10));
    const q2 = query(collection(db, 'matchmakingApplications'), where('uid', '==', userId), limit(10));
    const q3 = query(collection(db, 'matchmakingApplications'), where('userUid', '==', userId), limit(10));

    const [s1, s2, s3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
    const docs = [...(s1?.docs || []), ...(s2?.docs || []), ...(s3?.docs || [])];
    if (!docs.length) return { ok: false, reason: 'application_required' };

    const seen = new Set();
    let hasNonStubApplication = false;
    let hasPhotoOnlyMissing = false;
    for (const d of docs) {
      const id = safeStr(d?.id);
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      const a = d.data() || {};
      if (isStubMatchmakingApplication(a)) continue;
      hasNonStubApplication = true;
      if (hasMinimumProfileInApplicationDoc(a)) return { ok: true, reason: 'complete' };

      const gateState = getMatchmakingProfileGateStateFromApp(a);
      if (gateState.onlyPhotoMissing) hasPhotoOnlyMissing = true;
    }

    if (!hasNonStubApplication) return { ok: false, reason: 'application_required' };
    if (hasPhotoOnlyMissing) return { ok: false, reason: 'photo_required' };
    return { ok: false, reason: 'profile_incomplete' };
  } catch {
    // Rules/index/config issue: be conservative and allow the app.
    return { ok: true, reason: 'unknown' };
  }
}

export default function RequireCompletedApplication({ children, redirectTo = '/evlilik/eslestirme-basvuru?w=1' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [state, setState] = useState({ loading: true, ok: true, reason: 'complete' });

  const path = useMemo(() => normalizePath(location?.pathname), [location?.pathname]);

  useEffect(() => {
    if (loading) return;

    const uid = safeStr(user?.uid);
    if (!uid || user?.isAnonymous) {
      setState({ loading: false, ok: true, reason: 'complete' });
      return;
    }

    let alive = true;
    setState({ loading: true, ok: true, reason: 'complete' });

    (async () => {
      const next = await getProfileCompletionState(uid);
      if (!alive) return;
      setState({ loading: false, ok: !!next?.ok, reason: String(next?.reason || 'profile_incomplete') });
    })();

    return () => {
      alive = false;
    };
  }, [loading, user?.uid, user?.isAnonymous]);

  // Avoid accidental loops if someone wraps the apply route.
  if (path === '/wedding/apply' || path === '/evlilik/eslestirme-basvuru' || path === '/evlilik/eslestirme-basvurusu') {
    return children;
  }

  if (state.loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!state.ok) {
    const isPhotoRequired = state.reason === 'photo_required';
    return (
      <Navigate
        to={isPhotoRequired ? '/profilim' : redirectTo}
        replace
        state={{
          profileGate: isPhotoRequired ? 'photo_required' : state.reason || true,
          openPhotoManager: isPhotoRequired,
          from: `${location?.pathname || ''}${location?.search || ''}`,
        }}
      />
    );
  }

  return children;
}
