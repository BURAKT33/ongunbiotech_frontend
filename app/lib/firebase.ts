import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Web uygulaması için Firebase yapılandırması (API anahtarı tarayıcıda zaten görünür).
 * VITE_FIREBASE_* ortam değişkenleri varsa onlar önceliklidir; yoksa bu varsayılanlar kullanılır
 * — böylece Vercel’de env unutulsa bile yerel `.env.local` ile aynı proje açılır.
 */
const DEFAULT_FIREBASE = {
  apiKey: 'AIzaSyCBWtExvjHvUtlD68ELL_tKwq_UzJX7gHs',
  authDomain: 'ongunbiotech.firebaseapp.com',
  projectId: 'ongunbiotech',
  storageBucket: 'ongunbiotech.firebasestorage.app',
  messagingSenderId: '553474535072',
  appId: '1:553474535072:web:0c7444b85dccd1e1afa3c5',
  measurementId: 'G-W5ZEM9NZC3',
} as const;

function envOrDefault<T extends string | undefined>(envVal: T, fallback: string): string {
  const t = typeof envVal === 'string' ? envVal.trim() : '';
  return t || fallback;
}

const firebaseConfig = {
  apiKey: envOrDefault(import.meta.env.VITE_FIREBASE_API_KEY as string | undefined, DEFAULT_FIREBASE.apiKey),
  authDomain: envOrDefault(
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    DEFAULT_FIREBASE.authDomain,
  ),
  projectId: envOrDefault(
    import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    DEFAULT_FIREBASE.projectId,
  ),
  storageBucket: envOrDefault(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    DEFAULT_FIREBASE.storageBucket,
  ),
  messagingSenderId: envOrDefault(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    DEFAULT_FIREBASE.messagingSenderId,
  ),
  appId: envOrDefault(import.meta.env.VITE_FIREBASE_APP_ID as string | undefined, DEFAULT_FIREBASE.appId),
  measurementId: envOrDefault(
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
    DEFAULT_FIREBASE.measurementId,
  ),
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
