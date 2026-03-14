import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

function asMs(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
  return 0;
}

export function useMatchmakingResetAtMs() {
  const [state, setState] = useState({ loading: true, resetAtMs: 0, error: '' });

  useEffect(() => {
    const ref = doc(db, 'siteSettings', 'matchmaking');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};
        const resetAtMs = asMs(d?.matchmakingResetAtMs || d?.resetAtMs);
        setState({ loading: false, resetAtMs: resetAtMs > 0 ? resetAtMs : 0, error: '' });
      },
      (e) => {
        const msg = String(e?.message || '').trim();
        setState({ loading: false, resetAtMs: 0, error: msg || 'reset_read_failed' });
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, []);

  return state;
}
