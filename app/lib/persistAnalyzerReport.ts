import type { PlantAnalyzerResponse, SignalChartPayload } from './analyzerTypes';
import { getCurrentFirebaseUid } from './firebaseAuth';
import { saveReportFileToFirestore } from './firestoreReports';
import { normalizePlantAnalyzerResponse } from './normalizeAnalyzerResponse';
import type { ReportItem, ReportStatus } from './reportTypes';
import { getStoredUserProfile } from './session';

export const REPORTS_STORAGE_KEY = 'plantsignal-reports';
export const LAST_ANALYSIS_SUMMARY_KEY = 'plantsignal-last-analysis-summary';
export const PLANT_MONITOR_LABELS_KEY = 'plantsignal-monitor-labels';
export const REPORTS_UPDATED_EVENT = 'plantsignal-reports-updated';

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
  const normalized = normalizePlantAnalyzerResponse(data);
  if (normalized.ok === false) return null;
  if (typeof normalized.report !== 'string' || !normalized.report.trim()) {
    return null;
  }
  const id = `api-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const date =
    normalized.analysis?.metadata?.analysis_date ?? new Date().toISOString().slice(0, 10);
  const title = `Bitki sağlık raporu — ${date}`;
  const durum = getDurumFromPayload(normalized);
  const plant = plantLabel(normalized, options?.logicalFileName);
  const safeDate = date.replace(/[^\d-]/g, '') || 'tarih';
  const plantSlug = plant
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
  const reportFileName = `Bitki_Raporu_${safeDate}_${plantSlug || 'sinyal'}.md`;
  return {
    id,
    clientReportId: id,
    createdAt: new Date().toISOString(),
    title,
    date,
    plant,
    score: scoreFromAnalysis(normalized),
    status: mapDurumToStatus(durum),
    source: 'api',
    reportMarkdown: normalized.report,
    reportFileName,
    signalChart: normalized.signal_chart?.values?.length ? normalized.signal_chart : undefined,
    analyzerDurum: durum,
    stressScore:
      typeof normalized.analysis?.neurokit2_analysis?.stress_score === 'number'
        ? normalized.analysis.neurokit2_analysis.stress_score
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
  void syncReportFileToFirestore(item);
}

async function syncReportFileToFirestore(item: ReportItem) {
  if (item.source !== 'api' || !item.reportMarkdown?.trim()) return;
  const profile = getStoredUserProfile();
  const uid = getCurrentFirebaseUid();
  if (!profile?.uid || profile.uid !== uid) return;
  try {
    const docId = await saveReportFileToFirestore(item, {
      uid: profile.uid,
      role: profile.role,
      displayName: profile.displayName || profile.email || 'Kullanıcı',
      email: profile.email || '',
    });
    if (docId) {
      window.dispatchEvent(new Event(REPORTS_UPDATED_EVENT));
    }
  } catch {
    /* kurallar / ağ — yerel kayıt geçerli */
  }
}

export function saveLastAnalysisSummary(data: PlantAnalyzerResponse, title: string): void {
  try {
    const n = normalizePlantAnalyzerResponse(data);
    const summary: LastAnalysisSummary = {
      durum: getDurumFromPayload(n) ?? '—',
      stressScore: n.analysis?.neurokit2_analysis?.stress_score,
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

/** Yereldeki API raporları, yeniden eskiye (bitki izleme seçici). */
export function readApiReportsNewestFirst(): ReportItem[] {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list: ReportItem[] = Array.isArray(parsed) ? parsed : [];
    return list
      .filter((r) => r.source === 'api')
      .sort((a, b) => {
        const ta = Date.parse(a.createdAt || `${a.date}T12:00:00`) || 0;
        const tb = Date.parse(b.createdAt || `${b.date}T12:00:00`) || 0;
        return tb - ta || b.id.localeCompare(a.id);
      });
  } catch {
    return [];
  }
}

export function readMonitorCustomLabels(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PLANT_MONITOR_LABELS_KEY);
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === 'object' && !Array.isArray(o) ? (o as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function setMonitorCustomLabel(reportId: string, label: string): void {
  try {
    const m = { ...readMonitorCustomLabels() };
    const t = label.trim();
    if (t) m[reportId] = t;
    else delete m[reportId];
    localStorage.setItem(PLANT_MONITOR_LABELS_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function formatMonitorReportButtonLabel(
  report: ReportItem,
  customById: Record<string, string>,
): string {
  const custom = customById[report.id]?.trim();
  if (custom) return custom;
  const ts = report.createdAt
    ? new Date(report.createdAt).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : report.date;
  return `${ts} · ${report.plant}`;
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
