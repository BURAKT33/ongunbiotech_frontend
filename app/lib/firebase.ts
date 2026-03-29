import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

function hasClientConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey?.trim() &&
      firebaseConfig.projectId?.trim() &&
      firebaseConfig.appId?.trim(),
  );
}

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

export function isFirebaseConfigured(): boolean {
  return hasClientConfig();
}

export function getFirebaseApp(): FirebaseApp | undefined {
  if (!hasClientConfig()) return undefined;
  if (!app) {
    app = initializeApp({
      apiKey: firebaseConfig.apiKey!,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId!,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId!,
      ...(firebaseConfig.measurementId?.trim()
        ? { measurementId: firebaseConfig.measurementId.trim() }
        : {}),
    });
  }
  return app;
}

export function getFirestoreDb(): Firestore | undefined {
  const a = getFirebaseApp();
  if (!a) return undefined;
  if (!db) db = getFirestore(a);
  return db;
}

/** Storage bucket `firebaseConfig` ile gelir (ongunbiotech.firebasestorage.app). */
export function hasFirebaseStorageBucket(): boolean {
  return Boolean(firebaseConfig.storageBucket?.trim());
}
