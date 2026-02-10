function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function nowMinusMs(ms) {
  return Date.now() - Math.max(0, ms);
}

export function buildPreviewPoolItems() {
  const photoA = '/placeholder-user.jpg';
  const photoB = '/vecteezy_ai-generated-woman-walking-on-the-beach-romantic_37348905.jpg';
  const photoC = '/young-man-surfs-ocean-clear-water-waves.jpg';

  const base = [
    {
      uid: 'preview_user_1',
      createdAtMs: nowMinusMs(2 * 60 * 60 * 1000),
      profile: {
        username: 'A.',
        age: 28,
        gender: 'female',
        city: 'İstanbul',
        userCode: 'TR-1024',
        lastSeenAtMs: nowMinusMs(2 * 60 * 1000),
        about: 'Sanat ve seyahat seven, sakin bir hayatı tercih eden biriyim.',
        expectations: 'Saygı, dürüstlük ve iyi iletişim benim için önemli.',
        photoUrls: [photoB, photoA],
        details: { maritalStatus: 'single', occupation: 'Tasarımcı' },
      },
    },
    {
      uid: 'preview_user_2',
      createdAtMs: nowMinusMs(30 * 60 * 60 * 1000),
      profile: {
        username: 'M.',
        age: 32,
        gender: 'male',
        city: 'Ankara',
        userCode: 'TR-2048',
        lastSeenAtMs: nowMinusMs(15 * 60 * 1000),
        about: 'Spor ve kitap okumayı seviyorum. Aile değerleri benim için önemli.',
        expectations: 'Uyumlu ve anlayışlı bir ilişki arıyorum.',
        photoUrls: [photoC, photoA],
        details: { maritalStatus: 'divorced', occupation: 'Mühendis' },
      },
    },
    {
      uid: 'preview_user_3',
      createdAtMs: nowMinusMs(60 * 60 * 60 * 1000),
      profile: {
        username: 'S.',
        age: 26,
        gender: 'female',
        city: 'İzmir',
        userCode: 'TR-4096',
        lastSeenAtMs: nowMinusMs(3 * 60 * 60 * 1000),
        about: 'Doğa yürüyüşleri ve kahve keşifleri. Basit şeylerden mutlu olurum.',
        expectations: 'Birlikte büyüyebileceğimiz, güven temelli bir ilişki.',
        photoUrls: [photoA],
        details: { maritalStatus: 'single', occupation: 'Öğretmen' },
      },
    },
  ];

  return base.map((x) => ({ ...x, uid: safeStr(x.uid) }));
}

export function buildPreviewMatches({ currentUid = 'guest' } = {}) {
  const photoA = '/placeholder-user.jpg';
  const photoB = '/vecteezy_ai-generated-woman-walking-on-the-beach-romantic_37348905.jpg';
  const photoC = '/young-man-surfs-ocean-clear-water-waves.jpg';

  const makeOtherProfile = (overrides) => ({
    username: 'Örnek Profil',
    age: 29,
    gender: 'female',
    city: 'İstanbul',
    userCode: 'TR-0001',
    lastSeenAtMs: nowMinusMs(8 * 60 * 1000),
    identityVerified: true,
    about: 'Bu bir örnek profildir. Kayıt olmadan mesaj/beğeni gönderemezsiniz.',
    expectations: 'İyi niyet ve saygı önemli.',
    photoUrls: [photoB, photoA, photoA],
    details: { maritalStatus: 'single', occupation: 'Mimar', hasChildren: 'no' },
    ...overrides,
  });

  return [
    {
      id: 'preview_match_1',
      status: 'mutual_interest',
      matchTier: 'pre_match',
      aUserId: safeStr(currentUid),
      bUserId: 'preview_user_1',
      userIds: [safeStr(currentUid), 'preview_user_1'],
      profiles: {
        a: { username: 'Sen', age: 30 },
        b: makeOtherProfile({ username: 'A.', age: 28, gender: 'female', city: 'İstanbul', userCode: 'TR-1024' }),
      },
      photoAccess: { aToB: false, bToA: false },
      photoBlurByUid: { [safeStr(currentUid)]: false, preview_user_1: false },
      createdAt: { seconds: Math.floor(nowMinusMs(6 * 60 * 60 * 1000) / 1000) },
      updatedAt: { seconds: Math.floor(nowMinusMs(2 * 60 * 60 * 1000) / 1000) },
    },
    {
      id: 'preview_match_2',
      status: 'proposed',
      matchTier: 'pre_match',
      aUserId: safeStr(currentUid),
      bUserId: 'preview_user_2',
      userIds: [safeStr(currentUid), 'preview_user_2'],
      profiles: {
        a: { username: 'Sen', age: 30 },
        b: makeOtherProfile({
          username: 'M.',
          age: 32,
          gender: 'male',
          city: 'Ankara',
          userCode: 'TR-2048',
          photoUrls: [photoC, photoA, photoA],
          details: { maritalStatus: 'divorced', occupation: 'Mühendis', hasChildren: 'yes', childrenCount: 1 },
        }),
      },
      photoAccess: { aToB: false, bToA: false },
      photoBlurByUid: { [safeStr(currentUid)]: false, preview_user_2: false },
      createdAt: { seconds: Math.floor(nowMinusMs(12 * 60 * 60 * 1000) / 1000) },
      updatedAt: { seconds: Math.floor(nowMinusMs(12 * 60 * 60 * 1000) / 1000) },
    },
  ];
}

export function buildPreviewMatchById(matchId, { currentUid = 'guest' } = {}) {
  const list = buildPreviewMatches({ currentUid });
  const mid = safeStr(matchId);
  return list.find((m) => safeStr(m?.id) === mid) || list[0] || null;
}

export function buildPreviewProfile() {
  const photoA = '/placeholder-user.jpg';
  const photoB = '/vecteezy_ai-generated-woman-walking-on-the-beach-romantic_37348905.jpg';
  return {
    mmUser: {
      id: 'guest',
      details: {
        about: 'Bu bir önizleme profildir. Kayıt olmadan etkileşim yapamazsınız.',
        expectations: 'Kayıt olup formu doldurduktan sonra beğeni/mesaj/istek gönderebilirsiniz.',
      },
      publicProfile: {
        about: 'Bu bir önizleme profildir.',
        expectations: 'Kayıt + form sonrası etkileşim.',
      },
      membership: { active: false },
      identityVerified: false,
      profileTextWriteOnceUsedAtMs: 0,
      photoUrls: [photoB, photoA],
    },
    latestApp: {
      id: 'preview_app_1',
      source: 'preview',
      age: 30,
      gender: 'male',
      country: 'Türkiye',
      city: 'İstanbul',
      nationality: 'tr',
      photoUrls: [photoB, photoA],
      about: 'Bu bir örnek başvurudur.',
      expectations: 'Bu bir örnek başvurudur.',
      details: { about: 'Bu bir örnek başvurudur.', expectations: 'Bu bir örnek başvurudur.' },
    },
    resolvedPhotoUrls: [photoB, photoA],
  };
}
