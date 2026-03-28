import fs from 'node:fs';
import path from 'node:path';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      const current = process.env[key];
      if (current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return '';
  return String(next).trim();
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = Object.prototype.hasOwnProperty.call(obj || {}, k) ? obj[k] : null;
  return out;
}

function briefKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.keys(obj).sort();
}

loadEnvLocal();

const uid = getArgValue('--uid');
if (!uid) {
  // eslint-disable-next-line no-console
  console.log('Kullanım: node scripts/admin-inspect-userdoc.mjs --uid <uid>');
  process.exit(1);
}

const { db } = getAdmin();

const userSnap = await db.collection('matchmakingUsers').doc(String(uid)).get();
const userDoc = userSnap.exists ? userSnap.data() || {} : null;

let appDoc = null;
let appId = '';

if (userDoc) {
  appId = safeStr(userDoc.applicationId);
  if (appId) {
    const appSnap = await db.collection('matchmakingApplications').doc(appId).get();
    if (appSnap.exists) appDoc = { id: appSnap.id, ...(appSnap.data() || {}) };
  }
}

if (!appDoc) {
  const appsSnap = await db.collection('matchmakingApplications').where('userId', '==', String(uid)).limit(10).get();
  const apps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
  apps.sort((a, b) => {
    const am = typeof a.updatedAtMs === 'number' ? a.updatedAtMs : (typeof a.createdAtMs === 'number' ? a.createdAtMs : 0);
    const bm = typeof b.updatedAtMs === 'number' ? b.updatedAtMs : (typeof b.createdAtMs === 'number' ? b.createdAtMs : 0);
    return bm - am;
  });
  appDoc = apps[0] || null;
}

const u = userDoc || {};
const uDetails = u.details && typeof u.details === 'object' && !Array.isArray(u.details) ? u.details : {};
const uPP = u.partnerPreferences && typeof u.partnerPreferences === 'object' && !Array.isArray(u.partnerPreferences)
  ? u.partnerPreferences
  : {};
const uAppCache = u.application && typeof u.application === 'object' && !Array.isArray(u.application) ? u.application : {};

const a = appDoc && typeof appDoc === 'object' ? appDoc : {};
const aDetails = a.details && typeof a.details === 'object' && !Array.isArray(a.details) ? a.details : {};
const aPP = a.partnerPreferences && typeof a.partnerPreferences === 'object' && !Array.isArray(a.partnerPreferences)
  ? a.partnerPreferences
  : {};

const report = {
  ok: true,
  uid: String(uid),
  matchmakingUsers: userDoc
    ? {
        topKeys: briefKeys(userDoc),
        sample: {
          fullName: u.fullName ?? null,
          age: u.age ?? null,
          gender: u.gender ?? null,
          city: u.city ?? null,
          country: u.country ?? null,
          whatsapp: u.whatsapp ?? null,
          instagram: u.instagram ?? null,
          applicationId: safeStr(u.applicationId) || null,
        },
        detailsKeys: briefKeys(uDetails),
        detailsPick: pick(uDetails, [
          'occupation',
          'occupationTr',
          'job',
          'profession',
          'maritalStatus',
          'hasChildren',
          'childrenCount',
          'childrenLivingSituation',
          'education',
          'religion',
          'about',
          'expectations',
        ]),
        partnerPreferencesKeys: briefKeys(uPP),
        partnerPreferencesPick: pick(uPP, [
          'ageMin',
          'ageMax',
          'heightMinCm',
          'heightMaxCm',
          'maritalStatus',
          'religion',
          'livingCountry',
          'communicationMethods',
          'smokingPreference',
          'alcoholPreference',
          'childrenPreference',
          'educationPreference',
          'occupationPreference',
          'familyValuesPreference',
        ]),
        applicationCacheKeys: briefKeys(uAppCache),
        applicationCacheDetailsKeys: briefKeys(
          uAppCache.details && typeof uAppCache.details === 'object' && !Array.isArray(uAppCache.details) ? uAppCache.details : {}
        ),
      }
    : null,
  matchmakingApplication: appDoc
    ? {
        id: safeStr(appDoc.id) || null,
        topKeys: briefKeys(appDoc),
        sample: {
          status: a.status ?? null,
          fullName: a.fullName ?? null,
          age: a.age ?? null,
          gender: a.gender ?? null,
          city: a.city ?? null,
          country: a.country ?? null,
          whatsapp: a.whatsapp ?? null,
          instagram: a.instagram ?? null,
          source: a.source ?? null,
        },
        detailsKeys: briefKeys(aDetails),
        detailsPick: pick(aDetails, [
          'occupation',
          'occupationTr',
          'job',
          'profession',
          'maritalStatus',
          'hasChildren',
          'childrenCount',
          'childrenLivingSituation',
          'education',
          'religion',
          'about',
          'expectations',
        ]),
        partnerPreferencesKeys: briefKeys(aPP),
        partnerPreferencesPick: pick(aPP, [
          'ageMin',
          'ageMax',
          'heightMinCm',
          'heightMaxCm',
          'maritalStatus',
          'religion',
          'livingCountry',
          'communicationMethods',
          'smokingPreference',
          'alcoholPreference',
          'childrenPreference',
          'educationPreference',
          'occupationPreference',
          'familyValuesPreference',
        ]),
        photo: {
          photoUrlsCount: Array.isArray(a.photoUrls) ? a.photoUrls.filter(Boolean).length : 0,
          photoPathsCount: Array.isArray(a.photoPaths) ? a.photoPaths.filter(Boolean).length : 0,
          photoPath: safeStr(a.photoPath) || null,
        },
      }
    : null,
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));
