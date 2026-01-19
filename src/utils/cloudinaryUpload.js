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

export async function uploadImageToCloudinaryAuto(file, { folder = '', tags = [] } = {}) {
  const mode = import.meta?.env?.MODE || '';

  // Varsayılan davranış: önce signed dene.
  // Bu, Cloudinary hesabında unsigned kapalıysa (signed-only) en doğru akış.
  // Signed çalışmıyorsa ve client-side preset tanımlıysa (ör. local dev), unsigned'a düş.
  try {
    return await uploadImageToCloudinarySigned(file, { folder, tags });
  } catch (signedErr) {
    if (!isCloudinaryUnsignedUploadEnabled()) throw signedErr;

    try {
      return await uploadImageToCloudinary(file, { folder, tags });
    } catch (unsignedErr) {
      // Dev modda iki ihtimal de fail edebileceği için daha anlaşılır bir hata üret.
      const signedMsg = String(signedErr?.message || 'signed_failed');
      const unsignedMsg = String(unsignedErr?.message || 'unsigned_failed');
      const err = new Error(
        mode === 'development'
          ? `Cloudinary upload failed (signed then unsigned). Signed: ${signedMsg}. Unsigned: ${unsignedMsg}`
          : signedMsg
      );
      err.details = { signed: signedErr?.details, unsigned: unsignedErr?.details };
      throw err;
    }
  }
}
