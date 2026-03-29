import type { SignalChartPayload } from './analyzerTypes';

export type ReportStatus = 'Tamamlandı' | 'İnceleniyor' | 'Uyarı';

export type ReportSource = 'sample' | 'api';

export interface ReportItem {
  id: string;
  /** İstemciye kaydedildiği an (ISO); bitki izlemede “gelen tarih” için */
  createdAt?: string;
  /** Analyzer istemci kimliği (Firestore ile eşleştirme) */
  clientReportId?: string;
  /** Firestore belge id */
  cloudId?: string;
  /** Rapor sahibi Firebase uid */
  ownerUid?: string;
  /** Kayıt yeri (liste etiketi) */
  storageBackend?: 'local' | 'cloud';
  title: string;
  date: string;
  plant: string;
  /** Mühendis görünümünde bağlı çiftçi adı */
  farmerName?: string;
  score: number;
  source: ReportSource;
  status: ReportStatus;
  /** Plant analyzer markdown raporu */
  reportMarkdown?: string;
  /** İndirme / dosya satırı için önerilen ad */
  reportFileName?: string;
  /** Firebase Storage’daki nesne yolu (örn. users/uid/reports/...) */
  reportStoragePath?: string;
  /** Yalnızca rapor sahibi için; mühendis başkasının Storage URL’sini görmez */
  reportStorageDownloadUrl?: string;
  signalChart?: SignalChartPayload;
  /** API kök `durum` (örn. kötü / iyi) */
  analyzerDurum?: string;
  stressScore?: number;
}
