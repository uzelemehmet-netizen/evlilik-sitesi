import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const envLocalPath = path.join(projectRoot, '.env.local');

const REQUIRED_VARS = [
  {
    key: 'MATCHMAKING_FREE_PROMO_ENABLED',
    value: '1',
    comment: "Matchmaking Eko promo ücretsiz aktivasyon (2026-02-10'a kadar) - localde varsayılan AÇIK. Kapatmak için: 0 / false / no / off / disabled",
    mustHaveValue: false,
  },
  {
    key: 'VITE_CLOUDINARY_CLOUD_NAME',
    value: 'dj1xg1c56',
    comment: 'Cloudinary cloud name',
  },
  {
    key: 'VITE_CLOUDINARY_UPLOAD_PRESET',
    value: 'ml_default',
    comment: 'Cloudinary unsigned upload preset (opsiyonel; hesabınız signed-only ise kullanmayabilirsiniz)',
  },
  {
    key: 'CLOUDINARY_CLOUD_NAME',
    value: 'dj1xg1c56',
    comment: 'Cloudinary (server-side) cloud name - signed upload için gerekir',
    mustHaveValue: true,
  },
  {
    key: 'CLOUDINARY_API_KEY',
    value: '',
    comment: 'Cloudinary (server-side) API key - signed upload için gerekir (gizli; VITE_ kullanmayın)',
    mustHaveValue: true,
  },
  {
    key: 'CLOUDINARY_API_SECRET',
    value: '',
    comment: 'Cloudinary (server-side) API secret - signed upload için gerekir (gizli; VITE_ kullanmayın)',
    mustHaveValue: true,
  },
  {
    key: 'FIREBASE_SERVICE_ACCOUNT_JSON_FILE',
    value: '',
    comment:
      'Firebase Admin (server-side /api) service account JSON dosya yolu (opsiyonel ama /api matchmaking endpointleri için gerekir). Örn: C:\\...\\firebase-service-account.json',
    mustHaveValue: false,
  },
  {
    key: 'TRANSLATE_PROVIDER',
    value: 'deepl',
    comment: 'Çeviri sağlayıcısı: deepl | libretranslate (chat manuel çeviri için).',
    mustHaveValue: false,
  },
  {
    key: 'DEEPL_API_KEY',
    value: '',
    comment: 'DeepL API key (gizli). Yoksa manuel çeviri 501 translate_not_configured döner.',
    mustHaveValue: false,
  },
  {
    key: 'DEEPL_API_URL',
    value: 'https://api-free.deepl.com/v2/translate',
    comment: 'DeepL endpoint. Free plan: https://api-free.deepl.com/v2/translate, Pro: https://api.deepl.com/v2/translate',
    mustHaveValue: false,
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

const hasNonEmptyValue = (content, key) => {
  // IMPORTANT: After '=', do NOT use \s* because it includes newlines and would
  // accidentally capture the next line when the value is empty.
  const re = new RegExp(`^\\s*${key}\\s*=[ \\t]*(.*)$`, 'm');
  const m = content.match(re);
  if (!m) return false;
  const value = String(m[1] || '').trim();
  return value !== '';
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
  const emptyRequired = [];

  for (const v of REQUIRED_VARS) {
    if (!hasKey(next, v.key)) {
      const suffix = (next.endsWith('\n') ? '' : '\n') + `\n# ${v.comment}\n${v.key}=${v.value}\n`;
      next += suffix;
      didChange = true;
      continue;
    }

    if (v.mustHaveValue && !hasNonEmptyValue(next, v.key)) {
      emptyRequired.push(v.key);
    }
  }

  if (!didChange && !emptyRequired.length) {
    console.log('[ensure-env] .env.local zaten gerekli değerleri içeriyor.');
    return;
  }

  if (emptyRequired.length) {
    console.log('[ensure-env] Uyarı: bazı değişkenler var ama değeri boş:', emptyRequired.join(', '));
    console.log('[ensure-env] Bu değerleri .env.local içinde doldurun (gizli olanları asla paylaşmayın).');
  }

  fs.writeFileSync(envLocalPath, next, 'utf8');
  console.log('[ensure-env] .env.local güncellendi (eksik değişkenler eklendi).');
};

ensureFile();

// Ek uyarı: Matchmaking akışı /api üzerinden Firebase Admin ister.
try {
  const content = readIfExists() || '';
  const hasServiceAccount = hasNonEmptyValue(content, 'FIREBASE_SERVICE_ACCOUNT_JSON_FILE') || hasNonEmptyValue(content, 'FIREBASE_SERVICE_ACCOUNT_JSON');
  if (!hasServiceAccount) {
    console.log('[ensure-env] Uyarı: Firebase Admin service account ayarlı değil.');
    console.log('[ensure-env] Sonuç: /api/matchmaking-* endpointleri localde 503 (firebase_admin_not_configured) döner ve mesaj gönderme/heartbeat çalışmaz.');
    console.log('[ensure-env] Çözüm: Firebase Console → Project settings → Service accounts → Generate new private key');
    console.log('[ensure-env] İndirdiğiniz JSON dosyasının yolunu .env.local içine yazın:');
    console.log('[ensure-env]   FIREBASE_SERVICE_ACCOUNT_JSON_FILE=C\\path\\to\\service-account.json');
  }
} catch {
  // ignore
}
