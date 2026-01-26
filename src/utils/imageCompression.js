function isImageFile(file) {
  return !!file && typeof file.type === 'string' && file.type.startsWith('image/');
}

function safeFileName(file, fallback) {
  const name = typeof file?.name === 'string' ? file.name.trim() : '';
  return name || fallback;
}

async function loadImageFromFile(file) {
  const url = URL.createObjectURL(file);
  try {
    // createImageBitmap daha hızlı/az bellek olabilir; yoksa img ile fallback.
    if (typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(file);
      return { kind: 'bitmap', bmp, url };
    }

    const img = document.createElement('img');
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    return { kind: 'img', img, url };
  } catch (e) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
    throw e;
  }
}

export async function compressImageToJpeg(file, { maxWidth = 2000, maxHeight = 2000, quality = 0.85 } = {}) {
  if (!isImageFile(file)) return file;

  const loaded = await loadImageFromFile(file);

  try {
    const w = loaded.kind === 'bitmap' ? loaded.bmp.width : loaded.img.naturalWidth || loaded.img.width;
    const h = loaded.kind === 'bitmap' ? loaded.bmp.height : loaded.img.naturalHeight || loaded.img.height;

    if (!w || !h) return file;

    const scale = Math.min(1, maxWidth / w, maxHeight / h);
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    if (loaded.kind === 'bitmap') {
      ctx.drawImage(loaded.bmp, 0, 0, targetW, targetH);
    } else {
      ctx.drawImage(loaded.img, 0, 0, targetW, targetH);
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;

    // Orijinal isim yerine stabil bir jpg isim verelim (Cloudinary tarafında tür net olsun)
    const outName = safeFileName(file, 'image.jpg').replace(/\.[^.]+$/, '') + '.jpg';
    const out = new File([blob], outName, { type: 'image/jpeg' });

    // Zaten küçülmediyse orijinali kullan.
    if (typeof file.size === 'number' && typeof out.size === 'number' && out.size >= file.size) return file;

    return out;
  } finally {
    try {
      if (loaded.kind === 'bitmap' && typeof loaded.bmp?.close === 'function') loaded.bmp.close();
    } catch {
      // ignore
    }

    try {
      URL.revokeObjectURL(loaded.url);
    } catch {
      // ignore
    }
  }
}

export function getFileSizeMb(file) {
  const bytes = typeof file?.size === 'number' ? file.size : 0;
  return bytes > 0 ? bytes / (1024 * 1024) : 0;
}

export function isLikelyTooLargeImage(file, { maxMb = 25 } = {}) {
  const mb = getFileSizeMb(file);
  return mb > maxMb;
}
