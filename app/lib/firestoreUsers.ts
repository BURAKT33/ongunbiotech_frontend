import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
