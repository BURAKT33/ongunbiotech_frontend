import { getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';
import { getFirebaseApp, isFirebaseConfigured } from './firebase';

function getStorageOrNull() {
  if (!isFirebaseConfigured()) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getStorage(app);
  } catch {
    return null;
  }
}

function safeSegment(s: string, max = 96): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, max);
}

/**
 * Rapor metnini Firebase Storage’da gerçek dosya olarak kaydeder.
 * Kural: `users/{uid}/reports/...` (storage.rules ile uyumlu).
 */
export async function uploadReportMarkdownAsFile(opts: {
  ownerUid: string;
  clientReportId: string;
  reportFileName: string;
  markdown: string;
}): Promise<{ storagePath: string; downloadUrl: string } | null> {
  const storage = getStorageOrNull();
  if (!storage) return null;
  const baseName = opts.reportFileName.trim().toLowerCase().endsWith('.md')
    ? opts.reportFileName.trim()
    : `${opts.reportFileName.trim()}.md`;
  const filePart = safeSegment(baseName.replace(/\.md$/i, '') || 'rapor', 80);
  const idPart = safeSegment(opts.clientReportId, 64);
  const storagePath = `users/${opts.ownerUid}/reports/${idPart}_${filePart}.md`;
  const r = ref(storage, storagePath);
  await uploadString(r, opts.markdown, 'raw', {
    contentType: 'text/markdown; charset=utf-8',
  });
  const downloadUrl = await getDownloadURL(r);
  return { storagePath, downloadUrl };
}
