function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeText(v) {
  return safeStr(v).toLowerCase();
}

function looksLikeSyntheticEmail(value) {
  const email = normalizeText(value);
  if (!email) return false;
  if (email.endsWith('@example.test')) return true;
  if (email.includes('mobile.signup.')) return true;
  const atIndex = email.indexOf('@');
  const localPart = atIndex >= 0 ? email.slice(0, atIndex) : email;
  if (/^(deneme|test)\d*(?:[._+-].*)?$/.test(localPart)) return true;
  if (/(^|[._+-])(e2e|seed|deneme|test)([._+-]|$)/.test(localPart)) return true;
  return false;
}

function looksLikeSyntheticUid(value) {
  const uid = normalizeText(value);
  if (!uid) return false;
  return uid === 'test1' || uid === 'test2' || uid.startsWith('seed_') || uid.startsWith('e2e_');
}

function looksLikeSyntheticLabel(value) {
  const label = normalizeText(value);
  if (!label) return false;
  if (label.includes('mobile.signup.')) return true;
  if (/(^|[^a-z0-9])(e2e)([^a-z0-9]|$)/i.test(label)) return true;
  if (/(^|[^a-z0-9])(seed[._-])/i.test(label)) return true;
  if (/(^|[^a-z0-9])(test|deneme)([^a-z0-9]|$)/i.test(label)) return true;
  if (/(test|deneme)\d{1,6}$/i.test(label)) return true;
  return false;
}

function looksLikeSyntheticSource(value) {
  const source = normalizeText(value);
  if (!source) return false;
  return source === 'seed' || source === 'e2e' || source === 'e2e_manual' || source === 'hidden_test_user';
}

export function isSyntheticTestUserRecord({ uid = '', email = '', user = null, application = null } = {}) {
  const userDoc = user && typeof user === 'object' ? user : {};
  const appDoc = application && typeof application === 'object' ? application : {};

  if (looksLikeSyntheticUid(uid)) return true;
  if (userDoc?.isSyntheticTestUser === true || userDoc?.testAccount === true) return true;
  if (appDoc?.isSyntheticTestUser === true || appDoc?.testAccount === true) return true;

  const emails = [
    email,
    userDoc?.authEmail,
    userDoc?.authEmailLower,
    userDoc?.email,
    userDoc?.emailLower,
    appDoc?.authEmail,
    appDoc?.email,
  ];
  if (emails.some(looksLikeSyntheticEmail)) return true;

  const labels = [
    userDoc?.displayName,
    userDoc?.fullName,
    userDoc?.username,
    appDoc?.fullName,
    appDoc?.username,
  ];
  if (labels.some(looksLikeSyntheticLabel)) return true;

  if (looksLikeSyntheticSource(userDoc?.source) || looksLikeSyntheticSource(appDoc?.source)) return true;
  if (safeStr(userDoc?.seedTag) || safeStr(appDoc?.seedTag)) return true;
  if (safeStr(userDoc?.seedBatchId) || safeStr(appDoc?.seedBatchId)) return true;

  return false;
}