import type { PlantAnalyzerResponse, SignalChartPayload } from './analyzerTypes';
import type { ReportItem, ReportStatus } from './reportTypes';

export const REPORTS_STORAGE_KEY = 'plantsignal-reports';
export const LAST_ANALYSIS_SUMMARY_KEY = 'plantsignal-last-analysis-summary';

export type LastAnalysisSummary = {
  durum: string;
  stressScore?: number;
  title: string;
  at: string;
};

function mapDurumToStatus(durum?: string): ReportStatus {
  const t = (durum ?? '').toLowerCase();
  if (t.includes('kötü') || t.includes('kotu') || t.includes('köt')) return 'Uyarı';
  if (t.includes('iyi') || t.includes('good') || t.includes('optimal')) return 'Tamamlandı';
  return 'İnceleniyor';
}

export function getDurumFromPayload(data: PlantAnalyzerResponse): string | undefined {
  if (typeof data.durum === 'string' && data.durum.trim()) return data.durum.trim();
  const inner = data.analysis?.durum;
  if (typeof inner === 'string' && inner.trim()) return inner.trim();
  return undefined;
}

function scoreFromAnalysis(data: PlantAnalyzerResponse): number {
  const stress = data.analysis?.neurokit2_analysis?.stress_score;
  if (typeof stress === 'number' && Number.isFinite(stress)) {
    return Math.max(0, Math.min(100, Math.round(100 - stress * 6)));
  }
  return mapDurumToStatus(getDurumFromPayload(data)) === 'Uyarı' ? 55 : 78;
}

function plantLabel(data: PlantAnalyzerResponse, fallbackFile?: string | null): string {
  const path = data.analysis?.metadata?.source_file;
  if (path && typeof path === 'string') {
    const base = path.split('/').pop();
    if (base) return base.replace(/\.[^.]+$/, '') || base;
  }
  if (fallbackFile) return fallbackFile.replace(/\.[^.]+$/, '') || fallbackFile;
  return 'Elektrofizyoloji sinyali';
}

export function buildReportItemFromAnalyzer(
  data: PlantAnalyzerResponse,
  options?: { logicalFileName?: string | null },
): ReportItem | null {
  if (data.ok === false) return null;
  if (typeof data.report !== 'string' || !data.report.trim()) {
    return null;
  }
  const id = `api-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const date =
    data.analysis?.metadata?.analysis_date ?? new Date().toISOString().slice(0, 10);
  const title = `Sinyal analizi — ${date}`;
  const durum = getDurumFromPayload(data);
  return {
    id,
    title,
    date,
    plant: plantLabel(data, options?.logicalFileName),
    score: scoreFromAnalysis(data),
    status: mapDurumToStatus(durum),
    source: 'api',
    reportMarkdown: data.report,
    signalChart: data.signal_chart?.values?.length ? data.signal_chart : undefined,
    analyzerDurum: durum,
    stressScore:
      typeof data.analysis?.neurokit2_analysis?.stress_score === 'number'
        ? data.analysis.neurokit2_analysis.stress_score
        : undefined,
  };
}

export function appendReportToLocalStorage(item: ReportItem): void {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    const prev: ReportItem[] = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
    const merged = [...prev, item].reduce<ReportItem[]>((acc, r) => {
      if (!acc.some((x) => x.id === r.id)) acc.push(r);
      return acc;
    }, []);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}

export function saveLastAnalysisSummary(data: PlantAnalyzerResponse, title: string): void {
  try {
    const summary: LastAnalysisSummary = {
      durum: getDurumFromPayload(data) ?? '—',
      stressScore: data.analysis?.neurokit2_analysis?.stress_score,
      title,
      at: new Date().toISOString(),
    };
    localStorage.setItem(LAST_ANALYSIS_SUMMARY_KEY, JSON.stringify(summary));
  } catch {
    /* ignore */
  }
}

export function readLastAnalysisSummary(): LastAnalysisSummary | null {
  try {
    const raw = localStorage.getItem(LAST_ANALYSIS_SUMMARY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastAnalysisSummary;
  } catch {
    return null;
  }
}

/** Bitki izlemede göstermek için en son API raporundaki signal_chart */
export function readLatestApiSignalChart(): SignalChartPayload | null {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list: ReportItem[] = Array.isArray(parsed) ? parsed : [];
    const withChart = list.filter((r) => r.source === 'api' && r.signalChart?.values?.length);
    if (withChart.length === 0) return null;
    withChart.sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id),
    );
    return withChart[0]?.signalChart ?? null;
  } catch {
    return null;
  }
}

export const REPORTS_UPDATED_EVENT = 'plantsignal-reports-updated';
