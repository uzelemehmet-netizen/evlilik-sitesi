import { signInWithCustomToken, signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseAuth.js';

export async function signInWithCustomTokenForTests(customToken) {
  const credential = await signInWithCustomToken(auth, String(customToken || ''));
  return credential?.user?.uid || '';
}

export async function signOutForTests() {
  await signOut(auth);
}