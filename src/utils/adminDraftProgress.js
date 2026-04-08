function safeStr(value) {
  return String(value ?? '').trim();
}

function toMs(value) {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value?.ms === 'number' && Number.isFinite(value.ms)) return value.ms;
  if (typeof value?.toMillis === 'function') {
    try {
      return value.toMillis();
    } catch {
      return 0;
    }
  }
  const seconds = typeof value?.seconds === 'number' ? value.seconds : null;
  const nanoseconds = typeof value?.nanoseconds === 'number' ? value.nanoseconds : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

function normalizeKeys(value) {
  const arr = Array.isArray(value) ? value : [];
  const out = [];
  for (const raw of arr) {
    const key = safeStr(raw);
    if (!key || out.includes(key)) continue;
    out.push(key);
  }
  return out;
}

export function getDraftFieldLabel(key) {
  const map = {
    photo: 'Fotoğraf',
    username: 'Kullanıcı adı',
    fullName: 'Ad soyad',
    age: 'Yaş',
    city: 'Şehir',
    nationality: 'Uyruk',
    gender: 'Cinsiyet',
    whatsapp: 'WhatsApp',
    occupation: 'Meslek',
    maritalStatus: 'Medeni durum',
    hasChildren: 'Çocuk durumu',
    childrenCount: 'Çocuk sayısı',
    childrenLivingSituation: 'Çocukların yaşam durumu',
    consent18Plus: '18+ onayı',
    consentPrivacy: 'Gizlilik onayı',
    consentTerms: 'Şartlar onayı',
  };

  const normalized = safeStr(key);
  return map[normalized] || normalized || '-';
}

export function getDraftProgressInfo(application) {
  if (!application || typeof application !== 'object') return null;

  const source = safeStr(application?.source).toLowerCase();
  const isAutoStub = source === 'auto_stub' || application?.details?.autoBootstrap === true;
  const progress = application?.draftProgress && typeof application.draftProgress === 'object' ? application.draftProgress : null;

  if (!isAutoStub && !progress) return null;

  const completedRequiredKeys = normalizeKeys(progress?.completedRequiredKeys);
  const missingRequiredKeys = normalizeKeys(progress?.missingRequiredKeys);
  const totalRequiredCountRaw = Number(progress?.totalRequiredCount);
  const completedRequiredCountRaw = Number(progress?.completedRequiredCount);
  const totalRequiredCount =
    Number.isInteger(totalRequiredCountRaw) && totalRequiredCountRaw >= 0
      ? totalRequiredCountRaw
      : completedRequiredKeys.length + missingRequiredKeys.length;
  const completedRequiredCount =
    Number.isInteger(completedRequiredCountRaw) && completedRequiredCountRaw >= 0
      ? completedRequiredCountRaw
      : completedRequiredKeys.length;
  const firstMissingRequiredKey = safeStr(progress?.firstMissingRequiredKey) || missingRequiredKeys[0] || '';
  const lastInputKey = safeStr(progress?.lastInputKey);
  const draftUpdatedAtMs =
    (typeof application?.draftUpdatedAtMs === 'number' && Number.isFinite(application.draftUpdatedAtMs) ? application.draftUpdatedAtMs : 0) ||
    toMs(application?.draftUpdatedAt) ||
    (typeof application?.updatedAtMs === 'number' && Number.isFinite(application.updatedAtMs) ? application.updatedAtMs : 0) ||
    toMs(application?.updatedAt) ||
    (typeof application?.createdAtMs === 'number' && Number.isFinite(application.createdAtMs) ? application.createdAtMs : 0) ||
    toMs(application?.createdAt);

  return {
    isAutoStub,
    completedRequiredKeys,
    missingRequiredKeys,
    totalRequiredCount,
    completedRequiredCount,
    firstMissingRequiredKey,
    firstMissingRequiredLabel: getDraftFieldLabel(firstMissingRequiredKey),
    lastInputKey,
    lastInputLabel: getDraftFieldLabel(lastInputKey),
    draftUpdatedAtMs,
    photoComplete: progress?.photoComplete === true,
    wizardStep: Number.isInteger(Number(progress?.wizardStep)) ? Number(progress.wizardStep) : null,
  };
}