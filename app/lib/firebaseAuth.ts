import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithCredential,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseApp, isFirebaseConfigured } from './firebase';

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : undefined;
}

export function getCurrentFirebaseUid(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

/** Authentication → Sign-in method → Anonymous açık olmalı. */
export async function ensureFirebaseSignedIn(): Promise<User | null> {
  if (!isFirebaseConfigured()) return null;
  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  try {
    const { user } = await signInAnonymously(auth);
    return user;
  } catch {
    return null;
  }
}

export async function signInFirebaseWithGoogleIdToken(idToken: string): Promise<User | null> {
  if (!isFirebaseConfigured()) return null;
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    const cred = GoogleAuthProvider.credential(idToken);
    const { user } = await signInWithCredential(auth, cred);
    return user;
  } catch {
    return null;
  }
}

export async function firebaseSignOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return;
  try {
    await signOut(auth);
  } catch {
    /* ignore */
  }
}
