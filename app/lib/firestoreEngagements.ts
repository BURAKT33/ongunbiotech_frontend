import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { COL, engagementDocId } from './firestorePaths';

/** Mühendis konsoldan veya ileride UI’dan çiftçi uid’si ile bağ kurar. */
export async function createFarmerEngineerLink(engineerUid: string, farmerUid: string) {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(doc(db, COL.engagements, engagementDocId(engineerUid, farmerUid)), {
    engineerUid,
    farmerUid,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function listFarmerUidsForEngineer(engineerUid: string): Promise<string[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, COL.engagements),
    where('engineerUid', '==', engineerUid),
    where('active', '==', true),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => (d.data() as { farmerUid?: string }).farmerUid)
    .filter((x): x is string => Boolean(x));
}
