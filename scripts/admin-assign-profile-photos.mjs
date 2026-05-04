import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';
import { ensureUserCodeAssigned } from '../apiRoutes/_matchmakingUserCode.js';

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

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const normalized = safeStr(value);
    if (normalized) return normalized;
  }
  return '';
}

function pickInt(...values) {
  for (const value of values) {
    const numeric = typeof value === 'number' ? value : Number(String(value ?? '').trim());
    if (Number.isFinite(numeric)) return Math.trunc(numeric);
  }
  return null;
}

function sanitizeDetails(details) {
  const out = { ...asObj(details) };
  delete out.autoBootstrap;
  delete out.draftInProgress;
  delete out.missingProfile;
  return out;
}

function parseCloudinaryUrl(raw) {
  const s = safeStr(raw);
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'cloudinary:') return null;
    const cloudName = u.hostname ? decodeURIComponent(u.hostname) : '';
    const apiKey = u.username ? decodeURIComponent(u.username) : '';
    const apiSecret = u.password ? decodeURIComponent(u.password) : '';
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  } catch {
    return null;
  }
}

function resolveCloudinaryEnv() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (parsed) {
      if (!cloudName) cloudName = parsed.cloudName;
      if (!apiKey) apiKey = parsed.apiKey;
      if (!apiSecret) apiSecret = parsed.apiSecret;
    }
  }

  return { cloudName, apiKey, apiSecret };
}

function buildSignature(params, apiSecret) {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  const toSign = filtered.map(([k, v]) => `${k}=${v}`).join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return '';
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return '';
  return String(next).trim();
}

function argValues(flag) {
  const out = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] !== flag) continue;
    const next = process.argv[i + 1];
    if (!next || next.startsWith('--')) continue;
    out.push(String(next).trim());
  }
  return out;
}

function mimeFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.heic') return 'image/heic';
  if (ext === '.heif') return 'image/heif';
  return 'application/octet-stream';
}

function usage(exitCode = 0) {
  console.log('Kullanim: node scripts/admin-assign-profile-photos.mjs (--userCode UC-1131 | --uid <uid>) --file "C:/path/1.jpg" --file "C:/path/2.jpg" [--markSubmitted]');
  process.exit(exitCode);
}

function toMs(tsLike) {
  try {
    if (!tsLike) return 0;
    if (typeof tsLike?.toMillis === 'function') return tsLike.toMillis() || 0;
    const seconds = tsLike?._seconds ?? tsLike?.seconds;
    const nanoseconds = tsLike?._nanoseconds ?? tsLike?.nanoseconds;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      const n = typeof nanoseconds === 'number' && Number.isFinite(nanoseconds) ? nanoseconds : 0;
      return Math.floor(seconds * 1000 + n / 1e6);
    }
  } catch {
    // ignore
  }
  return 0;
}

function parseUserCodeNo(value) {
  const match = safeStr(value).toUpperCase().match(/^UC-(\d+)$/);
  if (!match) return 0;
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

function scoreApplication(app) {
  let score = 0;
  const source = safeStr(app?.source).toLowerCase();
  if (source && source !== 'auto_stub') score += 100;
  if (safeStr(app?.username)) score += 20;
  if (typeof app?.profileNo === 'number' && Number.isFinite(app.profileNo)) score += 10;
  if (Array.isArray(app?.photoUrls) && app.photoUrls.filter(Boolean).length) score += 5;
  score +=
    (typeof app?.updatedAtMs === 'number' && Number.isFinite(app.updatedAtMs) ? app.updatedAtMs : 0) ||
    (typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0) ||
    toMs(app?.updatedAt) ||
    toMs(app?.createdAt);
  return score;
}

async function uploadFileToCloudinary(filePath, { folder = '', tags = [], cloudName = '', apiKey = '', apiSecret = '' } = {}) {
  const buffer = await fs.promises.readFile(filePath);
  const mime = mimeFromFile(filePath);
  const timestamp = Math.floor(Date.now() / 1000);
  const tagsStr = Array.isArray(tags) ? tags.filter(Boolean).join(',') : '';
  const signature = buildSignature({ folder, tags: tagsStr, timestamp }, apiSecret);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: mime }), path.basename(filePath));
  formData.append('api_key', String(apiKey));
  formData.append('timestamp', String(timestamp));
  formData.append('signature', String(signature));
  if (folder) formData.append('folder', folder);
  if (tagsStr) formData.append('tags', tagsStr);

  const res = await fetch(uploadUrl, { method: 'POST', body: formData });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message || `cloudinary_upload_failed_${res.status}`);
  }

  const secureUrl = safeStr(data?.secure_url || data?.url);
  if (!secureUrl) throw new Error('cloudinary_response_invalid');

  return {
    secureUrl,
    publicId: safeStr(data?.public_id),
    bytes: Number(data?.bytes) || 0,
    width: Number(data?.width) || 0,
    height: Number(data?.height) || 0,
    originalFilename: safeStr(data?.original_filename) || path.basename(filePath),
    localPath: filePath,
  };
}

loadEnvLocal();

const userCode = safeStr(argValue('--userCode'));
const uidArg = safeStr(argValue('--uid'));
const filePaths = argValues('--file').slice(0, 5);
const markSubmitted = process.argv.includes('--markSubmitted');

if ((!userCode && !uidArg) || !filePaths.length) usage(1);

for (const filePath of filePaths) {
  if (!fs.existsSync(filePath)) {
    console.error(`Dosya bulunamadi: ${filePath}`);
    process.exit(1);
  }
}

const { cloudName, apiKey, apiSecret } = resolveCloudinaryEnv();
if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary env eksik. CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET veya CLOUDINARY_URL gerekli.');
  process.exit(1);
}

const { db, FieldValue } = getAdmin();
let userDocRef = null;
if (uidArg) {
  const directUserSnap = await db.collection('matchmakingUsers').doc(uidArg).get();
  if (!directUserSnap.exists) {
    console.error(`Kullanici bulunamadi: ${uidArg}`);
    process.exit(1);
  }
  userDocRef = directUserSnap.ref;
} else {
  const userSnap = await db.collection('matchmakingUsers').where('userCode', '==', userCode).limit(5).get();
  if (userSnap.empty) {
    console.error(`Kullanici bulunamadi: ${userCode}`);
    process.exit(1);
  }
  userDocRef = userSnap.docs[0].ref;
}

const uid = userDocRef.id;
const userDocSnap = await userDocRef.get();
const userDoc = userDocSnap.data() || {};
const appsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(20).get();
const apps = appsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
if (!apps.length) {
  console.error(`Basvuru bulunamadi: ${userCode}`);
  process.exit(1);
}

apps.sort((a, b) => scoreApplication(b) - scoreApplication(a));
const app = apps[0];
const appRef = db.collection('matchmakingApplications').doc(app.id);
const userRef = db.collection('matchmakingUsers').doc(uid);

const ensuredCode = await ensureUserCodeAssigned({
  db,
  FieldValue,
  uid,
  gender: safeStr(userDoc?.gender || userDoc?.publicProfile?.gender || userDoc?.application?.gender || app?.gender),
  nowMs: Date.now(),
});
const effectiveUserCode = safeStr(ensuredCode?.userCode || userDoc?.userCode || userCode);
const effectiveUserCodeNo =
  (typeof ensuredCode?.userCodeNo === 'number' && Number.isFinite(ensuredCode.userCodeNo) ? ensuredCode.userCodeNo : 0) ||
  (typeof userDoc?.userCodeNo === 'number' && Number.isFinite(userDoc.userCodeNo) ? userDoc.userCodeNo : 0) ||
  parseUserCodeNo(effectiveUserCode);
const userApplication = asObj(userDoc?.application);
const publicProfile = asObj(userDoc?.publicProfile);
const mergedDetails = sanitizeDetails({
  ...asObj(publicProfile?.details),
  ...asObj(userApplication?.details),
  ...asObj(userDoc?.details),
  ...asObj(app?.details),
});
const mergedPartnerPreferences = {
  ...asObj(publicProfile?.partnerPreferences),
  ...asObj(userApplication?.partnerPreferences),
  ...asObj(userDoc?.partnerPreferences),
  ...asObj(app?.partnerPreferences),
};
const coreUsername = firstNonEmpty(app?.username, userApplication?.username, publicProfile?.username, userDoc?.username);
const coreUsernameLower = firstNonEmpty(app?.usernameLower, userApplication?.usernameLower, publicProfile?.usernameLower, coreUsername.toLowerCase());
const coreFullName = firstNonEmpty(app?.fullName, userApplication?.fullName, publicProfile?.fullName, userDoc?.fullName, userDoc?.displayName);
const coreAge = pickInt(app?.age, userApplication?.age, publicProfile?.age, userDoc?.age);
const coreCity = firstNonEmpty(app?.city, userApplication?.city, publicProfile?.city, userDoc?.city);
const coreCountry = firstNonEmpty(app?.country, userApplication?.country, publicProfile?.country, userDoc?.country);
const coreNationality = firstNonEmpty(app?.nationality, userApplication?.nationality, publicProfile?.nationality, userDoc?.nationality, coreCountry);
const coreGender = firstNonEmpty(app?.gender, userApplication?.gender, publicProfile?.gender, userDoc?.gender);
const coreWhatsapp = firstNonEmpty(app?.whatsapp, userApplication?.whatsapp, userDoc?.whatsapp, app?.phone, userApplication?.phone, userDoc?.phone);
const coreLookingForGender = firstNonEmpty(app?.lookingForGender, userApplication?.lookingForGender, publicProfile?.lookingForGender, userDoc?.lookingForGender);
const coreLookingForNationality = firstNonEmpty(
  app?.lookingForNationality,
  userApplication?.lookingForNationality,
  publicProfile?.lookingForNationality,
  userDoc?.lookingForNationality
);
const about = firstNonEmpty(app?.about, mergedDetails?.about, userApplication?.about, publicProfile?.about);
const expectations = firstNonEmpty(app?.expectations, mergedDetails?.expectations, userApplication?.expectations, publicProfile?.expectations);
const aboutTr = firstNonEmpty(app?.aboutTr, mergedDetails?.aboutTr, userApplication?.aboutTr, publicProfile?.aboutTr);
const aboutId = firstNonEmpty(app?.aboutId, mergedDetails?.aboutId, userApplication?.aboutId, publicProfile?.aboutId);
const expectationsTr = firstNonEmpty(app?.expectationsTr, mergedDetails?.expectationsTr, userApplication?.expectationsTr, publicProfile?.expectationsTr);
const expectationsId = firstNonEmpty(app?.expectationsId, mergedDetails?.expectationsId, userApplication?.expectationsId, publicProfile?.expectationsId);
const profileTextLang = firstNonEmpty(app?.profileTextLang, userDoc?.profileTextLang);

const folder = `uniqah/matchmakingApplications/${app.id}`;
const uploaded = [];
const uploadTag = userCode || uidArg || uid;
for (let index = 0; index < filePaths.length; index += 1) {
  const filePath = filePaths[index];
  const result = await uploadFileToCloudinary(filePath, {
    folder,
    tags: ['matchmaking', 'photo-update', `photo${index + 1}`, uploadTag],
    cloudName,
    apiKey,
    apiSecret,
  });
  uploaded.push(result);
}

const photoUrls = uploaded.map((item) => item.secureUrl).filter(Boolean).slice(0, 5);
const photoPublicIds = uploaded.map((item) => item.publicId).filter(Boolean).slice(0, 5);
const nowMs = Date.now();
const topLevelUserPatch = {
  photoUrls,
  deferredPhotoRequiredForInteraction: false,
  hasSubmittedProfile: true,
  applicationState: 'real',
  applicationId: app.id,
  ...(coreUsername ? { username: coreUsername } : {}),
  ...(coreUsernameLower ? { usernameLower: coreUsernameLower } : {}),
  ...(coreFullName ? { fullName: coreFullName } : {}),
  ...(typeof coreAge === 'number' ? { age: coreAge } : {}),
  ...(coreCity ? { city: coreCity } : {}),
  ...(coreCountry ? { country: coreCountry } : {}),
  ...(coreNationality ? { nationality: coreNationality } : {}),
  ...(coreGender ? { gender: coreGender } : {}),
  ...(coreWhatsapp ? { whatsapp: coreWhatsapp } : {}),
  ...(coreLookingForGender ? { lookingForGender: coreLookingForGender } : {}),
  ...(coreLookingForNationality ? { lookingForNationality: coreLookingForNationality } : {}),
  ...(Object.keys(mergedDetails).length ? { details: mergedDetails } : {}),
  ...(Object.keys(mergedPartnerPreferences).length ? { partnerPreferences: mergedPartnerPreferences } : {}),
  ...(profileTextLang ? { profileTextLang } : {}),
  updatedAt: FieldValue.serverTimestamp(),
  updatedAtMs: nowMs,
  photoModeration: FieldValue.delete(),
};
const nestedAppPatch = {
  photoUrls,
  photoPublicIds,
  deferredPhotoRequiredForInteraction: false,
  source: 'apply_submit',
  ...(coreUsername ? { username: coreUsername } : {}),
  ...(coreUsernameLower ? { usernameLower: coreUsernameLower } : {}),
  ...(coreFullName ? { fullName: coreFullName } : {}),
  ...(typeof coreAge === 'number' ? { age: coreAge } : {}),
  ...(coreCity ? { city: coreCity } : {}),
  ...(coreCountry ? { country: coreCountry } : {}),
  ...(coreNationality ? { nationality: coreNationality } : {}),
  ...(coreGender ? { gender: coreGender } : {}),
  ...(coreWhatsapp ? { whatsapp: coreWhatsapp } : {}),
  ...(coreLookingForGender ? { lookingForGender: coreLookingForGender } : {}),
  ...(coreLookingForNationality ? { lookingForNationality: coreLookingForNationality } : {}),
  ...(about ? { about } : {}),
  ...(expectations ? { expectations } : {}),
  ...(aboutTr ? { aboutTr } : {}),
  ...(aboutId ? { aboutId } : {}),
  ...(expectationsTr ? { expectationsTr } : {}),
  ...(expectationsId ? { expectationsId } : {}),
  ...(Object.keys(mergedDetails).length ? { details: mergedDetails } : {}),
  ...(Object.keys(mergedPartnerPreferences).length ? { partnerPreferences: mergedPartnerPreferences } : {}),
  ...(profileTextLang ? { profileTextLang } : {}),
  ...(effectiveUserCode ? { userCode: effectiveUserCode } : {}),
  ...(effectiveUserCodeNo > 0 ? { userCodeNo: effectiveUserCodeNo } : {}),
};
const publicProfilePatch = {
  photoUrls,
  photoPublicIds,
  deferredPhotoRequiredForInteraction: false,
  ...(coreUsername ? { username: coreUsername } : {}),
  ...(coreUsernameLower ? { usernameLower: coreUsernameLower } : {}),
  ...(coreFullName ? { fullName: coreFullName } : {}),
  ...(typeof coreAge === 'number' ? { age: coreAge } : {}),
  ...(coreCity ? { city: coreCity } : {}),
  ...(coreCountry ? { country: coreCountry } : {}),
  ...(coreNationality ? { nationality: coreNationality } : {}),
  ...(coreGender ? { gender: coreGender } : {}),
  ...(coreLookingForGender ? { lookingForGender: coreLookingForGender } : {}),
  ...(coreLookingForNationality ? { lookingForNationality: coreLookingForNationality } : {}),
  ...(about ? { about } : {}),
  ...(expectations ? { expectations } : {}),
  ...(aboutTr ? { aboutTr } : {}),
  ...(aboutId ? { aboutId } : {}),
  ...(expectationsTr ? { expectationsTr } : {}),
  ...(expectationsId ? { expectationsId } : {}),
  ...(Object.keys(mergedDetails).length ? { details: mergedDetails } : {}),
  ...(Object.keys(mergedPartnerPreferences).length ? { partnerPreferences: mergedPartnerPreferences } : {}),
  ...(profileTextLang ? { profileTextLang } : {}),
  ...(effectiveUserCode ? { userCode: effectiveUserCode } : {}),
  ...(effectiveUserCodeNo > 0 ? { userCodeNo: effectiveUserCodeNo } : {}),
};

await Promise.all([
  appRef.set(
    {
      photoUrls,
      photoPublicIds,
      deferredPhotoRequiredForInteraction: false,
      photoUpdate: FieldValue.delete(),
      photoModeration: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: nowMs,
      ...(coreUsername ? { username: coreUsername } : {}),
      ...(coreUsernameLower ? { usernameLower: coreUsernameLower } : {}),
      ...(coreFullName ? { fullName: coreFullName } : {}),
      ...(typeof coreAge === 'number' ? { age: coreAge } : {}),
      ...(coreCity ? { city: coreCity } : {}),
      ...(coreCountry ? { country: coreCountry } : {}),
      ...(coreNationality ? { nationality: coreNationality } : {}),
      ...(coreGender ? { gender: coreGender } : {}),
      ...(coreWhatsapp ? { whatsapp: coreWhatsapp } : {}),
      ...(coreLookingForGender ? { lookingForGender: coreLookingForGender } : {}),
      ...(coreLookingForNationality ? { lookingForNationality: coreLookingForNationality } : {}),
      ...(about ? { about } : {}),
      ...(expectations ? { expectations } : {}),
      ...(aboutTr ? { aboutTr } : {}),
      ...(aboutId ? { aboutId } : {}),
      ...(expectationsTr ? { expectationsTr } : {}),
      ...(expectationsId ? { expectationsId } : {}),
      ...(Object.keys(mergedDetails).length ? { details: mergedDetails } : {}),
      ...(Object.keys(mergedPartnerPreferences).length ? { partnerPreferences: mergedPartnerPreferences } : {}),
      ...(profileTextLang ? { profileTextLang } : {}),
      ...(effectiveUserCode ? { userCode: effectiveUserCode } : {}),
      ...(effectiveUserCodeNo > 0 ? { userCodeNo: effectiveUserCodeNo } : {}),
      ...(markSubmitted ? { source: 'apply_submit' } : {}),
    },
    { merge: true }
  ),
  userRef.set(
    {
      ...topLevelUserPatch,
      ...(effectiveUserCodeNo > 0 ? { userCodeNo: effectiveUserCodeNo } : {}),
      application: nestedAppPatch,
      publicProfile: publicProfilePatch,
      'application.photoModeration': FieldValue.delete(),
      'publicProfile.photoModeration': FieldValue.delete(),
      ...(markSubmitted ? { 'application.source': 'apply_submit' } : {}),
    },
    { merge: true }
  ),
]);

console.log(
  JSON.stringify(
    {
      ok: true,
      userCode: effectiveUserCode || userCode || null,
      uid,
      applicationId: app.id,
      assignedUserCode: effectiveUserCode || null,
      assignedUserCodeNo: effectiveUserCodeNo || null,
      uploadedCount: uploaded.length,
      photoUrls,
      photoPublicIds,
    },
    null,
    2
  )
);