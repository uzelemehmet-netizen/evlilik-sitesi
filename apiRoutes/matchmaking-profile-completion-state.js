import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { fetchMatchmakingApplicationsByUid } from './_matchmakingApplications.js';
import {
  hasMinimumMatchmakingProfileInApplicationDoc,
  hasMinimumMatchmakingProfileInUserDoc,
} from '../src/utils/matchmakingProfileCompletion.js';

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid);
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
      return;
    }

    const { db } = getAdmin();
    const [userSnap, apps] = await Promise.all([
      db.collection('matchmakingUsers').doc(uid).get().catch(() => null),
      fetchMatchmakingApplicationsByUid(db, uid, { limit: 10 }),
    ]);

    const userDoc = userSnap?.exists ? (userSnap.data() || {}) : {};
    let completed = hasMinimumMatchmakingProfileInUserDoc(userDoc);

    if (!completed) {
      for (const app of Array.isArray(apps) ? apps : []) {
        if (hasMinimumMatchmakingProfileInApplicationDoc(app)) {
          completed = true;
          break;
        }
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: true, completed }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}