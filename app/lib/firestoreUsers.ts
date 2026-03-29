import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { COL } from './firestorePaths';
import type { UserRole } from './session';

export type FirestoreUserFields = {
  email: string;
  displayName: string;
  role: UserRole;
};

export async function upsertFirestoreUser(uid: string, fields: FirestoreUserFields) {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(
    doc(db, COL.users, uid),
    {
      ...fields,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export type ResolveSessionRoleResult =
  | { ok: true; role: UserRole; firestoreUserDocExists: boolean }
  | { ok: false; message: string };

/**
 * Girişte: `users/{uid}` içinde geçerli `role` varsa panel ile eşleşmeli.
 * Belge yoksa veya `role` alanı yoksa — ilk kez bu uygulamada bağlanıyor kabul edilir; panel rolü kullanılır.
 */
export async function resolveSessionRoleForLogin(
  uid: string,
  panelRole: UserRole,
): Promise<ResolveSessionRoleResult> {
  const db = getFirestoreDb();
  if (!db) {
    return {
      ok: false,
      message: 'Firestore kullanılamıyor; hesap rolü doğrulanamadı.',
    };
  }
  try {
    const snap = await getDoc(doc(db, COL.users, uid));
    if (!snap.exists()) {
      return { ok: true, role: panelRole, firestoreUserDocExists: false };
    }
    const r = snap.data()?.role;
    const stored: UserRole | null = r === 'muhendis' || r === 'ciftci' ? r : null;
    if (!stored) {
      return { ok: true, role: panelRole, firestoreUserDocExists: true };
    }
    if (stored !== panelRole) {
      if (stored === 'muhendis') {
        return {
          ok: false,
          message:
            'Bu hesap mühendis olarak kayıtlı. Lütfen mühendis girişini kullanın: /giris?rol=muhendis',
        };
      }
      return {
        ok: false,
        message:
          'Bu hesap çiftçi olarak kayıtlı. Lütfen çiftçi girişini kullanın: /giris (rol parametresi olmadan veya ?rol=ciftci)',
      };
    }
    return { ok: true, role: stored, firestoreUserDocExists: true };
  } catch {
    return {
      ok: false,
      message: 'Profil bilgisi alınamadı. Bağlantınızı kontrol edip tekrar deneyin.',
    };
  }
}
