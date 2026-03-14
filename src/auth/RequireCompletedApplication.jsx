import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthProvider';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function normalizeMaritalStatus(v) {
  return safeStr(v).toLowerCase();
}

function normalizePath(pathname) {
  const raw = String(pathname || '/');
  return raw.replace(/\/+$/, '') || '/';
}

function isStubApplication(a) {
  const source = safeStr(a?.source).toLowerCase();
  if (source === 'auto_stub') return true;
  if (a?.details?.autoBootstrap === true) return true;
  return false;
}

function hasMinimumProfileInUserDoc(d) {
  const userDoc = d && typeof d === 'object' ? d : {};
  const appFromUser = userDoc?.application && typeof userDoc.application === 'object' ? userDoc.application : null;
  const publicProfile = userDoc?.publicProfile && typeof userDoc.publicProfile === 'object' ? userDoc.publicProfile : null;
  const merged = {
    ...(publicProfile || {}),
    ...(appFromUser || {}),
    ...(userDoc || {}),
    details: {
      ...((publicProfile && typeof publicProfile.details === 'object' ? publicProfile.details : {}) || {}),
      ...((appFromUser && typeof appFromUser.details === 'object' ? appFromUser.details : {}) || {}),
      ...((userDoc?.details && typeof userDoc.details === 'object' ? userDoc.details : {}) || {}),
    },
  };

  const details = merged?.details && typeof merged.details === 'object' ? merged.details : {};

  const fullName = safeStr(merged?.fullName);
  const age = asNum(merged?.age);
  const gender = normalizeGender(merged?.gender);
  const city = safeStr(merged?.city);
  const country = safeStr(merged?.country);
  const nationality = safeStr(merged?.nationality);
  const occupation = safeStr(details?.occupation) || safeStr(merged?.occupation);
  const maritalStatus = normalizeMaritalStatus(details?.maritalStatus || merged?.maritalStatus);

  if (!fullName) return false;
  if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) return false;
  if (!gender) return false;
  if (!city) return false;
  if (!country) return false;
  if (!nationality) return false;
  if (!occupation) return false;
  if (!maritalStatus) return false;

  if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
    const hasChildren = safeStr(details?.hasChildren || merged?.hasChildren).toLowerCase();
    if (!hasChildren) return false;
    if (hasChildren === 'yes') {
      const cnt = asNum(details?.childrenCount);
      if (!(typeof cnt === 'number' && Number.isFinite(cnt) && cnt >= 1 && cnt <= 20)) return false;
    }
  }

  return true;
}

function hasMinimumProfileInApplicationDoc(a) {
  const app = a && typeof a === 'object' ? a : {};
  if (isStubApplication(app)) return false;
  const details = app?.details && typeof app.details === 'object' ? app.details : {};

  const fullName = safeStr(app?.fullName);
  const age = asNum(app?.age);
  const gender = normalizeGender(app?.gender);
  const city = safeStr(app?.city);
  const country = safeStr(app?.country);
  const nationality = safeStr(app?.nationality);
  const occupation = safeStr(details?.occupation) || safeStr(app?.occupation);
  const maritalStatus = normalizeMaritalStatus(details?.maritalStatus || app?.maritalStatus);

  if (!fullName) return false;
  if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) return false;
  if (!gender) return false;
  if (!city) return false;
  if (!country) return false;
  if (!nationality) return false;
  if (!occupation) return false;
  if (!maritalStatus) return false;

  if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
    const hasChildren = safeStr(details?.hasChildren || app?.hasChildren).toLowerCase();
    if (!hasChildren) return false;
    if (hasChildren === 'yes') {
      const cnt = asNum(details?.childrenCount);
      if (!(typeof cnt === 'number' && Number.isFinite(cnt) && cnt >= 1 && cnt <= 20)) return false;
    }
  }

  return true;
}

async function isProfileComplete(uid) {
  const userId = safeStr(uid);
  if (!userId) return false;

  // Fast path: matchmakingUsers minimum profile fields.
  try {
    const uRef = doc(db, 'matchmakingUsers', userId);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists()) {
      const d = uSnap.data() || {};
      if (hasMinimumProfileInUserDoc(d)) return true;
    }
  } catch {
    // ignore and fall back
  }

  // Fallback: matchmakingApplications, non-stub.
  try {
    const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', userId), limit(10));
    const snap = await getDocs(q);
    if (snap.empty) return false;

    for (const d of snap.docs) {
      const a = d.data() || {};
      if (hasMinimumProfileInApplicationDoc(a)) return true;
    }

    return false;
  } catch {
    // Rules/index/config issue: be conservative and allow the app.
    return true;
  }
}

export default function RequireCompletedApplication({ children, redirectTo = '/evlilik/eslestirme-basvuru?w=1' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [state, setState] = useState({ loading: true, ok: true });

  const path = useMemo(() => normalizePath(location?.pathname), [location?.pathname]);

  useEffect(() => {
    if (loading) return;

    const uid = safeStr(user?.uid);
    if (!uid || user?.isAnonymous) {
      setState({ loading: false, ok: true });
      return;
    }

    let alive = true;
    setState({ loading: true, ok: true });

    (async () => {
      const ok = await isProfileComplete(uid);
      if (!alive) return;
      setState({ loading: false, ok });
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
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ profileGate: true, from: `${location?.pathname || ''}${location?.search || ''}` }}
      />
    );
  }

  return children;
}
