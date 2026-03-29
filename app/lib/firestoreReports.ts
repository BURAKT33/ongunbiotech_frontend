import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { getFirestoreDb, hasFirebaseStorageBucket } from './firebase';
import { uploadReportMarkdownAsFile } from './firebaseStorageReport';
import { listFarmerUidsForEngineer } from './firestoreEngagements';
import { COL } from './firestorePaths';
import type { ReportItem } from './reportTypes';
import type { UserRole } from './session';

/** Firestore’da saklanan “dosya” kaydı (markdown rapor + isteğe bağlı grafik). */
export type FirestoreReportDoc = {
  ownerUid: string;
  ownerRole: UserRole;
  ownerDisplayName: string;
  ownerEmail: string;
  clientReportId: string;
  reportFileName: string;
  fileMimeType: 'text/markdown';
  title: string;
  date: string;
  plant: string;
  farmerName?: string;
  score: number;
  source: ReportItem['source'];
  status: ReportItem['status'];
  reportMarkdown: string;
  signalChart?: ReportItem['signalChart'];
  analyzerDurum?: string;
  stressScore?: number;
  reportStoragePath?: string;
  reportStorageDownloadUrl?: string;
  createdAt: ReturnType<typeof serverTimestamp>;
};

function toPayload(
  item: ReportItem,
  owner: { uid: string; role: UserRole; displayName: string; email: string },
): Omit<FirestoreReportDoc, 'createdAt' | 'fileMimeType'> & { fileMimeType: 'text/markdown' } {
  const name =
    item.reportFileName?.trim() ||
    `Bitki_Raporu_${item.date.replace(/[^\d-]/g, '') || 'tarih'}.md`;
  return {
    ownerUid: owner.uid,
    ownerRole: owner.role,
    ownerDisplayName: owner.displayName,
    ownerEmail: owner.email,
    clientReportId: item.clientReportId ?? item.id,
    reportFileName: name,
    fileMimeType: 'text/markdown',
    title: item.title,
    date: item.date,
    plant: item.plant,
    farmerName: item.farmerName,
    score: item.score,
    source: item.source,
    status: item.status,
    reportMarkdown: item.reportMarkdown ?? '',
    signalChart: item.signalChart,
    analyzerDurum: item.analyzerDurum,
    stressScore: item.stressScore,
  };
}

function fromDoc(docId: string, d: FirestoreReportDoc, viewer: { uid: string; role: UserRole }): ReportItem {
  const md = typeof d.reportMarkdown === 'string' ? d.reportMarkdown : '';
  const item: ReportItem = {
    id: `fs-${docId}`,
    cloudId: docId,
    clientReportId: d.clientReportId,
    ownerUid: d.ownerUid,
    storageBackend: 'cloud',
    title: d.title,
    date: d.date,
    plant: d.plant,
    farmerName: d.farmerName,
    score: d.score,
    source: d.source,
    status: d.status,
    reportMarkdown: md,
    reportFileName: d.reportFileName,
    reportStoragePath: d.reportStoragePath,
    signalChart: d.signalChart,
    analyzerDurum: d.analyzerDurum,
    stressScore: d.stressScore,
  };
  if (
    viewer.uid === d.ownerUid &&
    typeof d.reportStorageDownloadUrl === 'string' &&
    d.reportStorageDownloadUrl.startsWith('http')
  ) {
    item.reportStorageDownloadUrl = d.reportStorageDownloadUrl;
  }
  if (
    viewer.role === 'muhendis' &&
    d.ownerUid !== viewer.uid &&
    d.ownerRole === 'ciftci'
  ) {
    item.farmerName = d.ownerDisplayName || d.ownerEmail || item.farmerName;
  }
  return item;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function saveReportFileToFirestore(
  item: ReportItem,
  owner: { uid: string; role: UserRole; displayName: string; email: string },
): Promise<string | null> {
  if (item.source !== 'api') return null;
  if (!item.reportMarkdown?.trim()) return null;
  const db = getFirestoreDb();
  if (!db) return null;

  const payloadBase = toPayload(item, owner);
  const fileName =
    payloadBase.reportFileName ||
    `Bitki_Raporu_${item.date.replace(/[^\d-]/g, '') || 'tarih'}.md`;

  let reportStoragePath: string | undefined;
  let reportStorageDownloadUrl: string | undefined;
  if (hasFirebaseStorageBucket()) {
    try {
      const up = await uploadReportMarkdownAsFile({
        ownerUid: owner.uid,
        clientReportId: payloadBase.clientReportId,
        reportFileName: fileName,
        markdown: item.reportMarkdown,
      });
      if (up) {
        reportStoragePath = up.storagePath;
        reportStorageDownloadUrl = up.downloadUrl;
      }
    } catch {
      /* Storage kapalı veya kural — Firestore yine yazılır */
    }
  }

  const ref = await addDoc(
    collection(db, COL.reports),
    omitUndefined({
      ...payloadBase,
      reportFileName: fileName,
      reportStoragePath,
      reportStorageDownloadUrl,
      createdAt: serverTimestamp(),
    }) as DocumentData,
  );
  return ref.id;
}

async function queryOwnerReports(
  ownerUid: string,
  viewer: { uid: string; role: UserRole },
  max = 100,
): Promise<ReportItem[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, COL.reports),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((s) => fromDoc(s.id, s.data() as FirestoreReportDoc, viewer));
}

function dedupeByCloudId(items: ReportItem[]): ReportItem[] {
  const seen = new Set<string>();
  const out: ReportItem[] = [];
  for (const r of items) {
    const k = r.cloudId ?? r.id;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

/** Çiftçi: kendi dosyaları. Mühendis: kendi + engagements ile bağlı çiftçilerin dosyaları. */
export async function fetchReportFilesForSessionUser(opts: {
  uid: string;
  role: UserRole;
}): Promise<ReportItem[]> {
  const { uid, role } = opts;
  const viewer = { uid, role };
  const out: ReportItem[] = [];

  if (role === 'ciftci') {
    out.push(...(await queryOwnerReports(uid, viewer)));
    return out;
  }

  out.push(...(await queryOwnerReports(uid, viewer)));
  const farmers = await listFarmerUidsForEngineer(uid);
  const batch = 10;
  for (let i = 0; i < farmers.length; i += batch) {
    const chunk = farmers.slice(i, i + batch);
    const rows = await Promise.all(chunk.map((fid) => queryOwnerReports(fid, viewer)));
    out.push(...rows.flat());
  }
  return dedupeByCloudId(out);
}
