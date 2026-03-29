import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
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

export async function registerWithEmailPassword(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('firebase_auth_unavailable');
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const name = displayName.trim() || email.split('@')[0] || 'Kullanıcı';
  await updateProfile(user, { displayName: name });
  return user;
}

export async function signInWithEmailPasswordLogin(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('firebase_auth_unavailable');
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return user;
}

/** FirebaseAuth hata kodlarını kısa Türkçe mesaja çevirir. */
export function formatFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : '';
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Bu e-posta ile zaten bir hesap var.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/weak-password': 'Şifre çok zayıf (en az 6 karakter).',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı yok.',
    'auth/wrong-password': 'Şifre hatalı.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla deneme. Lütfen sonra tekrar deneyin.',
    'auth/operation-not-allowed': 'Firebase Console’da E-posta/şifre veya Google ile giriş açık olmalı.',
  };
  return map[code] || (err instanceof Error ? err.message : 'firebase_auth_error');
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
