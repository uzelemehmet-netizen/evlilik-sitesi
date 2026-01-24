import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function usage() {
  console.log('Usage: node scripts/cancel-memberships.mjs <uid1> <uid2> ...');
  console.log('Cancels membership + translationPack for given matchmakingUsers docs.');
  process.exit(1);
}

const uids = process.argv.slice(2).map((s) => String(s || '').trim()).filter(Boolean);
if (!uids.length || uids.includes('--help') || uids.includes('-h')) usage();

const { db, FieldValue } = getAdmin();

const now = Date.now();

let ok = 0;
let fail = 0;

for (const uid of uids) {
  const ref = db.collection('matchmakingUsers').doc(uid);
  try {
    await ref.set(
      {
        membership: {
          active: false,
          plan: 'free',
          validUntilMs: 0,
          cancelledAtMs: now,
        },
        translationPack: {
          active: false,
          plan: 'free',
          validUntilMs: 0,
          cancelledAtMs: now,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`[ok] cancelled membership for uid=${uid}`);
    ok += 1;
  } catch (e) {
    console.error(`[fail] uid=${uid} error=${String(e?.message || e)}`);
    fail += 1;
  }
}

console.log(`Done. ok=${ok} fail=${fail}`);
process.exit(fail ? 2 : 0);
