import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { COL } from './firestorePaths';
import type { UserRole } from './session';
import { generatePublicIdCandidate, normalizePublicIdInput } from './userPublicId';

export type FirestoreUserFields = {
  email: string;
  displayName: string;
  role: UserRole;
};

export type FirestoreUserIndexFields = {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
};

async function allocateUniquePublicId(
  db: NonNullable<ReturnType<typeof getFirestoreDb>>,
): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = generatePublicIdCandidate();
    const ref = doc(db, COL.userPublicIds, candidate);
    const s = await getDoc(ref);
    if (!s.exists()) return candidate;
  }
  throw new Error('public_id_allocate_failed');
}

/**
 * Kullanıcı profilini yazar; ilk kez veya eski hesaplarda kalıcı paylaşım kodu (`publicId`) atar
 * ve `userPublicIds/{publicId}` indeksini günceller (kodla kullanıcı çözümlemesi için).
 */
export async function upsertFirestoreUser(
  uid: string,
  fields: FirestoreUserFields,
): Promise<{ publicId: string } | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = doc(db, COL.users, uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : null;
  let publicId = typeof existing?.publicId === 'string' && existing.publicId ? existing.publicId : '';
  if (!publicId) {
    publicId = await allocateUniquePublicId(db);
  }
  await setDoc(
    ref,
    {
      ...fields,
      publicId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  const idxRef = doc(db, COL.userPublicIds, publicId);
  await setDoc(
    idxRef,
    {
      uid,
      role: fields.role,
      displayName: fields.displayName,
      email: fields.email || '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return { publicId };
}

/** `users/{uid}` içinden paylaşım kodu (giriş sonrası eksik localStorage doldurma). */
export async function fetchOwnPublicId(uid: string): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COL.users, uid));
  const pid = snap.data()?.publicId;
  return typeof pid === 'string' && pid ? pid : null;
}

/**
 * Yalnızca `userPublicIds` belgesini okur; başka kullanıcının `users/{uid}` belgesine erişim gerekmez.
 */
export async function getShareIndexByPublicId(
  publicIdInput: string,
): Promise<(FirestoreUserIndexFields & { publicId: string }) | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const normalized = normalizePublicIdInput(publicIdInput);
  if (!normalized) return null;
  const snap = await getDoc(doc(db, COL.userPublicIds, normalized));
  if (!snap.exists()) return null;
  const d = snap.data() as Record<string, unknown>;
  const uid = typeof d.uid === 'string' ? d.uid : '';
  const role = d.role === 'muhendis' || d.role === 'ciftci' ? d.role : null;
  const displayName = typeof d.displayName === 'string' ? d.displayName : '';
  const email = typeof d.email === 'string' ? d.email : '';
  if (!uid || !role) return null;
  return {
    publicId: normalized,
    uid,
    role,
    displayName,
    email,
  };
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
