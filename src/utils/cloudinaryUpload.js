import { auth } from '../config/firebaseAuth';

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeArr(value) {
  return Array.isArray(value) ? value : [];
}

function truncate(value, maxLen = 400) {
  const text = safeStr(value);
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

function currentPagePath() {
  if (typeof window === 'undefined') return '';
  try {
    return safeStr(window.location?.pathname || '');
  } catch {
    return '';
  }
}

function derivePhotoUploadSource({ source = '', folder = '', tags = [] } = {}) {
  const explicit = safeStr(source);
  if (explicit) return explicit;

  const folderKey = safeStr(folder).toLowerCase();
  const tagList = safeArr(tags).map((tag) => safeStr(tag).toLowerCase()).filter(Boolean);
  const path = currentPagePath().toLowerCase();

  if (tagList.includes('quick_profile') || folderKey.includes('quick-profile')) return 'matchmaking_quick_profile';
  if (tagList.includes('photo-update')) return 'studio_profile_photo_manager';
  if (tagList.includes('feedback')) return 'studio_feedback';
  if (tagList.includes('lead') || folderKey.includes('matchmakingleads')) return 'matchmaking_lead';
  if (folderKey.includes('matchmakingapplications')) return 'matchmaking_apply';
  if (path.startsWith('/admin')) return 'admin_panel';
  if (path.startsWith('/studio')) return 'studio_profile';
  if (path.startsWith('/login')) return 'login';
  return 'unknown';
}

function summarizeAttempt(stage, status, error = null) {
  const details = error && typeof error?.details === 'object' && error.details ? error.details : null;
  return {
    stage: safeStr(stage) || 'unknown',
    status: safeStr(status) || 'unknown',
    message: truncate(String(error?.message || ''), 300),
    code: truncate(
      String(details?.error || details?.code || details?.reason || details?.cause || details?.message || ''),
      220
    ),
  };
}

async function getBestEffortAuthHeader() {
  try {
    const currentUser = auth?.currentUser || null;
    if (!currentUser || currentUser.isAnonymous || typeof currentUser.getIdToken !== 'function') return '';
    const token = await currentUser.getIdToken();
    return token ? `Bearer ${token}` : '';
  } catch {
    return '';
  }
}

export async function reportPhotoUploadFailure(
  file,
  { folder = '', tags = [], source = '', error = null, attempts = [] } = {}
) {
  try {
    const body = {
      source: derivePhotoUploadSource({ source, folder, tags }),
      folder: safeStr(folder),
      tags: safeArr(tags).map((tag) => safeStr(tag)).filter(Boolean).slice(0, 12),
      pagePath: currentPagePath(),
      fileName: safeStr(file?.name),
      contentType: safeStr(file?.type),
      fileSize: Number(file?.size) || 0,
      lastError: truncate(String(error?.message || ''), 500),
      attempts: safeArr(attempts).map((attempt) => ({
        stage: safeStr(attempt?.stage),
        status: safeStr(attempt?.status),
        message: truncate(safeStr(attempt?.message), 300),
        code: truncate(safeStr(attempt?.code), 220),
      })),
      language: typeof navigator !== 'undefined' ? safeStr(navigator.language || '') : '',
      userAgent: typeof navigator !== 'undefined' ? truncate(String(navigator.userAgent || ''), 500) : '',
    };

    const authHeader = await getBestEffortAuthHeader();
    await fetch('/api/photo-upload-failure-report', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export function isCloudinaryUnsignedUploadEnabled() {
  const forceSigned = String(import.meta?.env?.VITE_CLOUDINARY_FORCE_SIGNED || '') === '1';
  if (forceSigned) return false;

  // Güvenlik + konfig netliği: unsigned upload varsayılan olarak KAPALI.
  // Sadece açıkça izin verildiğinde devreye girer.
  const allowUnsigned = String(import.meta?.env?.VITE_CLOUDINARY_ALLOW_UNSIGNED || '') === '1';
  if (!allowUnsigned) return false;

  const preset = import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME;
  return !!(preset && cloudName);
}

async function getCloudinarySignedParams({ folder = '', tags = [] } = {}) {
  let res;
  try {
    res = await fetch('/api/cloudinary-signature', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ folder, tags }),
    });
  } catch (e) {
    const apiTarget = import.meta?.env?.VITE_API_PROXY_TARGET;
    const hint = apiTarget
      ? `Vite proxy hedefi: ${apiTarget}`
      : 'Vite proxy varsayılan hedefi: http://localhost:3000';

    const err = new Error(
      `Cloudinary signature isteği başarısız (network). ` +
        `Sebep: ${String(e?.message || 'Failed to fetch')}. ` +
        `Lokal geliştirmede API + Web birlikte çalışmalı (\`npm run dev\`). ` +
        `${hint}`
    );
    err.details = { cause: String(e?.message || ''), hint };
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok || !data?.ok) {
    const serverCode = data?.error ? String(data.error) : '';

    if (serverCode === 'cloudinary_env_missing') {
      const missing = data?.missing && typeof data.missing === 'object' ? data.missing : null;
      const missingKeys = missing
        ? Object.entries(missing)
            .filter(([, v]) => !!v)
            .map(([k]) => k)
        : [];
      const missingStr = missingKeys.length ? ` Eksik: ${missingKeys.join(', ')}.` : '';

      const err = new Error(
        `Fotoğraf yükleme sunucu ayarları eksik olduğu için başlatılamadı (cloudinary_env_missing).` +
          missingStr +
          ` Deploy ortamında CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET` +
          ` veya tek değişken olarak CLOUDINARY_URL tanımlanmalı.`
      );
      err.details = data;
      throw err;
    }

    const hint = serverCode ? ` (${serverCode})` : '';
    const err = new Error(`Cloudinary signature failed: HTTP ${res.status}${hint}`);
    err.details = data;
    throw err;
  }

  return data;
}

export async function uploadImageToCloudinary(file, { folder = '', tags = [] } = {}) {
  const uploadPreset = import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME;

  if (!uploadPreset || !cloudName) {
    throw new Error('Cloudinary env missing (VITE_CLOUDINARY_UPLOAD_PRESET / VITE_CLOUDINARY_CLOUD_NAME)');
  }

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) formData.append('folder', folder);
  if (Array.isArray(tags) && tags.length) formData.append('tags', tags.filter(Boolean).join(','));

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = data?.error?.message || `Cloudinary upload failed (${res.status})`;
    const err = new Error(msg);
    err.details = data;
    throw err;
  }

  const secureUrl = data?.secure_url || data?.url;
  if (!secureUrl) {
    const err = new Error('Cloudinary response missing secure_url');
    err.details = data;
    throw err;
  }

  return {
    secureUrl,
    publicId: data?.public_id || '',
    bytes: data?.bytes || null,
    width: data?.width || null,
    height: data?.height || null,
    format: data?.format || '',
    originalFilename: data?.original_filename || '',
  };
}

export async function uploadImageToCloudinarySigned(file, { folder = '', tags = [] } = {}) {
  const signed = await getCloudinarySignedParams({ folder, tags });
  const cloudName = signed.cloudName;

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', String(signed.apiKey));
  formData.append('timestamp', String(signed.timestamp));
  formData.append('signature', String(signed.signature));
  if (signed.folder) formData.append('folder', String(signed.folder));
  if (signed.tags) formData.append('tags', String(signed.tags));

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = data?.error?.message || `Cloudinary signed upload failed (${res.status})`;
    const err = new Error(msg);
    err.details = data;
    throw err;
  }

  const secureUrl = data?.secure_url || data?.url;
  if (!secureUrl) {
    const err = new Error('Cloudinary response missing secure_url');
    err.details = data;
    throw err;
  }

  return {
    secureUrl,
    publicId: data?.public_id || '',
    bytes: data?.bytes || null,
    width: data?.width || null,
    height: data?.height || null,
    format: data?.format || '',
    originalFilename: data?.original_filename || '',
  };
}

async function fileToDataUrl(file) {
  if (!(file instanceof Blob)) {
    throw new Error('file_to_data_url_requires_blob');
  }

  return await new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('file_read_failed'));
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

export async function uploadImageToCloudinaryServer(file, { folder = '', tags = [] } = {}) {
  const dataUrl = await fileToDataUrl(file);
  if (!dataUrl) {
    throw new Error('cloudinary_server_data_url_missing');
  }

  let res;
  try {
    res = await fetch('/api/cloudinary-upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fileName: typeof file?.name === 'string' ? file.name : 'upload.jpg',
        contentType: typeof file?.type === 'string' ? file.type : '',
        dataUrl,
        folder,
        tags,
      }),
    });
  } catch (error) {
    const err = new Error(`Cloudinary server upload request failed: ${String(error?.message || 'network_error')}`);
    err.details = { cause: String(error?.message || '') };
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok || !data?.ok) {
    const msg = data?.error ? String(data.error) : `Cloudinary server upload failed (${res.status})`;
    const err = new Error(msg);
    err.details = data;
    throw err;
  }

  return {
    secureUrl: data?.secureUrl || '',
    publicId: data?.publicId || '',
    bytes: data?.bytes || null,
    width: data?.width || null,
    height: data?.height || null,
    format: data?.format || '',
    originalFilename: data?.originalFilename || '',
  };
}

export async function uploadImageToCloudinaryAuto(file, { folder = '', tags = [], source = '', reportFailure = true } = {}) {
  const mode = import.meta?.env?.MODE || '';
  const attempts = [];

  try {
    const uploaded = await uploadImageToCloudinaryServer(file, { folder, tags });
    attempts.push(summarizeAttempt('server_relay', 'ok'));
    return uploaded;
  } catch (serverErr) {
    attempts.push(summarizeAttempt('server_relay', 'failed', serverErr));

    try {
      const uploaded = await uploadImageToCloudinarySigned(file, { folder, tags });
      attempts.push(summarizeAttempt('signed', 'ok'));
      return uploaded;
    } catch (signedErr) {
      attempts.push(summarizeAttempt('signed', 'failed', signedErr));
      let unsignedErr = null;

      if (isCloudinaryUnsignedUploadEnabled()) {
        try {
          const uploaded = await uploadImageToCloudinary(file, { folder, tags });
          attempts.push(summarizeAttempt('unsigned', 'ok'));
          return uploaded;
        } catch (error) {
          unsignedErr = error;
          attempts.push(summarizeAttempt('unsigned', 'failed', error));
        }
      } else {
        attempts.push(summarizeAttempt('unsigned', 'skipped'));
      }

      const signedMsg = String(signedErr?.message || 'signed_failed');
      const unsignedMsg = String(unsignedErr?.message || 'unsigned_skipped');
      const serverMsg = String(serverErr?.message || 'server_failed');
      const err = new Error(
        mode === 'development'
          ? `Cloudinary upload failed (server relay, signed, unsigned). Server: ${serverMsg}. Signed: ${signedMsg}. Unsigned: ${unsignedMsg}`
          : serverMsg || signedMsg
      );
      err.details = { server: serverErr?.details, signed: signedErr?.details, unsigned: unsignedErr?.details, attempts };
      if (reportFailure !== false) {
        void reportPhotoUploadFailure(file, { folder, tags, source, error: err, attempts });
      }
      throw err;
    }
  }
}
