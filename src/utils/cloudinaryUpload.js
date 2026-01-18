export function isCloudinaryUnsignedUploadEnabled() {
  const preset = import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME;
  return !!(preset && cloudName);
}

async function getCloudinarySignedParams({ folder = '', tags = [] } = {}) {
  const res = await fetch('/api/cloudinary-signature', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ folder, tags }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok || !data?.ok) {
    const err = new Error('Cloudinary signature failed');
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
  try {
    return await uploadImageToCloudinarySigned(file, { folder, tags });
  } catch (err) {
    // Signed ortam hazır değilse unsigned'a düş (preset varsa)
    if (isCloudinaryUnsignedUploadEnabled()) {
      return await uploadImageToCloudinary(file, { folder, tags });
    }
    throw err;
  }
}
