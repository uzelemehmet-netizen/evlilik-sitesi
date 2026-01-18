import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const envLocalPath = path.join(projectRoot, '.env.local');

const REQUIRED_VARS = [
  {
    key: 'VITE_CLOUDINARY_CLOUD_NAME',
    value: 'dj1xg1c56',
    comment: 'Cloudinary cloud name',
  },
  {
    key: 'VITE_CLOUDINARY_UPLOAD_PRESET',
    value: 'websitemcloudinary',
    comment: 'Cloudinary unsigned upload preset',
  },
];

const normalize = (s) => String(s || '').replace(/\r\n/g, '\n');

const readIfExists = () => {
  try {
    return normalize(fs.readFileSync(envLocalPath, 'utf8'));
  } catch {
    return null;
  }
};

const hasKey = (content, key) => {
  const re = new RegExp(`^\\s*${key}\\s*=`, 'm');
  return re.test(content);
};

const ensureFile = () => {
  const existing = readIfExists();

  if (existing === null) {
    const header =
      '# Lokal geliştirme ortamı ayarları (Vite)\n' +
      '# Not: Bu dosya .gitignore\'da, repoya commit edilmez.\n\n';

    const body = REQUIRED_VARS.map(
      (v) => `# ${v.comment}\n${v.key}=${v.value}\n`
    ).join('\n');

    fs.writeFileSync(envLocalPath, header + body, 'utf8');
    console.log('[ensure-env] .env.local oluşturuldu.');
    return;
  }

  let next = existing;
  let didChange = false;

  for (const v of REQUIRED_VARS) {
    if (!hasKey(next, v.key)) {
      const suffix = (next.endsWith('\n') ? '' : '\n') + `\n# ${v.comment}\n${v.key}=${v.value}\n`;
      next += suffix;
      didChange = true;
    }
  }

  if (!didChange) {
    console.log('[ensure-env] .env.local zaten gerekli değerleri içeriyor.');
    return;
  }

  fs.writeFileSync(envLocalPath, next, 'utf8');
  console.log('[ensure-env] .env.local güncellendi (eksik değişkenler eklendi).');
};

ensureFile();
