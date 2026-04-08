import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

const batch = String(process.argv[2] || '').trim();

if (!batch) {
  console.error('Usage: node scripts/prepare-e2e-seed-users.mjs <seedBatchId>');
  process.exit(2);
}

const { db } = getAdmin();

function photoUrl(name) {
  const label = encodeURIComponent(String(name || 'seed').slice(0, 20));
  return `data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' fill='%23e2e8f0'/><circle cx='300' cy='220' r='96' fill='%2394a3b8'/><rect x='150' y='350' width='300' height='150' rx='28' fill='%2394a3b8'/><text x='300' y='560' text-anchor='middle' font-family='Arial' font-size='30' fill='%23475569'>${label}</text></svg>`;
}

const snap = await db.collection('matchmakingApplications').where('seedBatchId', '==', batch).get();

for (const appDoc of snap.docs) {
  const data = appDoc.data() || {};
  const details = data?.details && typeof data.details === 'object' ? data.details : {};
  const uid = String(data?.userId || '').trim();
  const photo = photoUrl(appDoc.id);

  await appDoc.ref.set(
    {
      photoUrls: [photo],
      updatedAtMs: Date.now(),
    },
    { merge: true }
  );

  if (!uid) continue;

  await db
    .collection('matchmakingUsers')
    .doc(uid)
    .set(
      {
        seedBatchId: batch,
        username: data?.username || '',
        age: data?.age || null,
        gender: data?.gender || '',
        city: data?.city || '',
        country: data?.country || '',
        photoUrls: [photo],
        application: {
          username: data?.username || '',
          fullName: data?.fullName || '',
          age: data?.age || null,
          gender: data?.gender || '',
          city: data?.city || '',
          country: data?.country || '',
          whatsapp: data?.whatsapp || '',
          lookingForGender: data?.lookingForGender || '',
          photoUrls: [photo],
        },
        publicProfile: {
          username: data?.username || '',
          age: data?.age || null,
          gender: data?.gender || '',
          city: data?.city || '',
          country: data?.country || '',
          photoUrls: [photo],
        },
        details: {
          maritalStatus: details?.maritalStatus || '',
          occupation: details?.occupation || '',
          hasChildren: details?.hasChildren || '',
          childrenCount: typeof details?.childrenCount === 'number' ? details.childrenCount : 0,
          childrenLivingSituation: details?.childrenLivingSituation || '',
          familyApprovalStatus: details?.familyApprovalStatus || '',
          religion: details?.religion || '',
          religiousValues: details?.religiousValues || '',
          incomeLevel: details?.incomeLevel || '',
          communicationLanguage: details?.communicationLanguage || '',
          smoking: details?.smoking || '',
          alcohol: details?.alcohol || '',
        },
      },
      { merge: true }
    );
}

console.log(JSON.stringify({ ok: true, batch, updated: snap.size }, null, 2));