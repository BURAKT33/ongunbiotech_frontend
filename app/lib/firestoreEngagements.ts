import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { getShareIndexByPublicId } from './firestoreUsers';
import { COL, engagementDocId } from './firestorePaths';
import type { UserRole } from './session';
import { normalizePublicIdInput } from './userPublicId';

/** Çiftçi bağlantı kurarken kendi adı (mühendis panelinde listeleme için). */
type LinkMeta = {
  engineerPublicId?: string;
  engineerLabel?: string;
  farmerDisplayName?: string;
  farmerEmail?: string;
};

function omitUndefinedFields(obj: Record<string, unknown>): DocumentData {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as DocumentData;
}

export async function createFarmerEngineerLink(
  engineerUid: string,
  farmerUid: string,
  meta?: LinkMeta,
) {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore kullanılamıyor (yapılandırma veya ağ).');
  await setDoc(
    doc(db, COL.engagements, engagementDocId(engineerUid, farmerUid)),
    omitUndefinedFields({
      engineerUid,
      farmerUid,
      engineerPublicId: meta?.engineerPublicId,
      engineerLabel: meta?.engineerLabel,
      farmerLabel: meta?.farmerDisplayName,
      farmerEmail: meta?.farmerEmail,
      active: true,
      createdAt: serverTimestamp(),
    }),
    { merge: true },
  );
}

export type LinkFarmerToEngineerResult =
  | { ok: true }
  | { ok: false; message: string };

/** Çiftçi, mühendisin paylaşım kodunu girerek rapor paylaşımı bağlar. */
export async function linkFarmerToEngineerByPublicId(
  farmerUid: string,
  farmerRole: UserRole,
  engineerPublicIdInput: string,
): Promise<LinkFarmerToEngineerResult> {
  if (farmerRole !== 'ciftci') {
    return { ok: false, message: 'Bu işlem yalnızca çiftçi hesabıyla yapılabilir.' };
  }
  if (!normalizePublicIdInput(engineerPublicIdInput)) {
    return { ok: false, message: 'Geçerli bir paylaşım kodu girin (örn. ONG-XXXXXXXX).' };
  }
  const idx = await getShareIndexByPublicId(engineerPublicIdInput);
  if (!idx) {
    return { ok: false, message: 'Bu kodla kayıtlı kullanıcı bulunamadı.' };
  }
  if (idx.role !== 'muhendis') {
    return {
      ok: false,
      message: 'Bu kod bir mühendis hesabına ait değil. Mühendis paylaşım kodunu girin.',
    };
  }
  if (idx.uid === farmerUid) {
    return { ok: false, message: 'Kendi kodunuzu girdiniz; başka bir mühendisin kodunu kullanın.' };
  }
  await createFarmerEngineerLink(idx.uid, farmerUid, {
    engineerPublicId: idx.publicId,
    engineerLabel: idx.displayName || idx.email || idx.publicId,
  });
  return { ok: true };
}

export type FarmerEngineerLinkRow = {
  engineerUid: string;
  engineerPublicId?: string;
  engineerLabel?: string;
};

export async function listEngineerLinksForFarmer(farmerUid: string): Promise<FarmerEngineerLinkRow[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, COL.engagements),
    where('farmerUid', '==', farmerUid),
    where('active', '==', true),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((docSnap) => {
      const d = docSnap.data() as {
        engineerUid?: string;
        engineerPublicId?: string;
        engineerLabel?: string;
      };
      if (!d.engineerUid) return null;
      return {
        engineerUid: d.engineerUid,
        engineerPublicId: d.engineerPublicId,
        engineerLabel: d.engineerLabel,
      };
    })
    .filter((x): x is FarmerEngineerLinkRow => x != null);
}

export type EngineerFarmerLinkRow = {
  farmerUid: string;
  farmerLabel?: string;
  farmerEmail?: string;
};

export async function listFarmerLinksForEngineer(engineerUid: string): Promise<EngineerFarmerLinkRow[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, COL.engagements),
    where('engineerUid', '==', engineerUid),
    where('active', '==', true),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((docSnap) => {
      const d = docSnap.data() as {
        farmerUid?: string;
        farmerLabel?: string;
        farmerEmail?: string;
      };
      if (!d.farmerUid) return null;
      return {
        farmerUid: d.farmerUid,
        farmerLabel: d.farmerLabel,
        farmerEmail: d.farmerEmail,
      };
    })
    .filter((x): x is EngineerFarmerLinkRow => x != null);
}

export async function listFarmerUidsForEngineer(engineerUid: string): Promise<string[]> {
  const rows = await listFarmerLinksForEngineer(engineerUid);
  return rows.map((r) => r.farmerUid);
}
