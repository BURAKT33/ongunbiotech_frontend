import type { SignalChartPayload } from './analyzerTypes';

export type ReportStatus = 'Tamamlandı' | 'İnceleniyor' | 'Uyarı';

export type ReportSource = 'sample' | 'api';

export interface ReportItem {
  id: string;
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
  signalChart?: SignalChartPayload;
  /** API kök `durum` (örn. kötü / iyi) */
  analyzerDurum?: string;
  stressScore?: number;
}
