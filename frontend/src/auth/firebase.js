import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  connectAuthEmulator,
} from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(config).every(Boolean);
const useAuthEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const authAppName = useAuthEmulator ? 'intervia-auth-emulator' : 'intervia-real-auth';
export const auth = firebaseConfigured ? getAuth(initializeApp(config, authAppName)) : null;

if (auth && useAuthEmulator) {
  if (!import.meta.env.DEV) {
    throw new Error('Firebase emulators can only be enabled during local development.');
  }
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

function requireAuth() {
  if (!auth) throw new Error('Sign-in is not configured yet. Add the Firebase web settings to frontend/.env.local.');
  return auth;
}

export async function registerWithEmail({ name, email, password }) {
  const userCredential = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
  await updateProfile(userCredential.user, { displayName: name.trim() });
  await sendEmailVerification(userCredential.user);
  await signOut(auth);
  return { verificationRequired: true, message: 'Check your inbox to verify your email, then sign in.' };
}

export async function loginWithEmail({ email, password }) {
  const userCredential = await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  if (!userCredential.user.emailVerified) {
    await sendEmailVerification(userCredential.user);
    await signOut(auth);
    throw new Error('Verify your email first. We sent a fresh verification link.');
  }
  return userCredential.user;
}

export async function loginWithProvider(providerName) {
  const activeAuth = requireAuth();
  const provider = providerName === 'google'
    ? new GoogleAuthProvider()
    : new OAuthProvider('microsoft.com');
  if (providerName === 'microsoft') {
    provider.setCustomParameters({ prompt: 'select_account' });
  }
  const result = await signInWithPopup(activeAuth, provider);
  return result.user;
}

export async function sendPasswordReset(email) {
  if (!email.trim()) throw new Error('Enter your email address first.');
  await sendPasswordResetEmail(requireAuth(), email.trim());
}

export async function signOutUser() {
  if (auth) await signOut(auth);
}
