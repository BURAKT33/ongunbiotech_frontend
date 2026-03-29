import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Database,
  FileText,
  RefreshCw,
  Users,
  Home,
  ClipboardList,
} from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';
import { getCurrentFirebaseUid } from '../../lib/firebaseAuth';
import { fetchReportFilesForSessionUser } from '../../lib/firestoreReports';
import {
  REPORTS_STORAGE_KEY,
  REPORTS_UPDATED_EVENT,
} from '../../lib/persistAnalyzerReport';
import { mergeCloudAndLocalApiReports } from '../../lib/reportMerge';
import type { ReportItem, ReportStatus } from '../../lib/reportTypes';
import { getStoredUserProfile } from '../../lib/session';
import { ReportMarkdownDocument } from './ReportMarkdownDocument';
import { ReportSignalCharts } from './ReportSignalCharts';

export type { ReportItem, ReportStatus } from '../../lib/reportTypes';

const sampleReports: ReportItem[] = [
  {
    id: 'sample-1',
    title: 'Haftalık Sulama Verimlilik Raporu',
    date: '2026-03-20',
    plant: 'Domates - Sera A',
    score: 92,
    source: 'sample',
    status: 'Tamamlandı',
  },
  {
    id: 'sample-2',
    title: 'Elektriksel Sinyal Trend Analizi',
    date: '2026-03-18',
    plant: 'Biber - Sera B',
    score: 84,
    source: 'sample',
    status: 'İnceleniyor',
  },
  {
    id: 'sample-3',
    title: 'Toprak Nem Dalgalanma Raporu',
    date: '2026-03-17',
    plant: 'Salatalık - Sera C',
    score: 68,
    source: 'sample',
    status: 'Uyarı',
  },
];

/** Sinyaller ekranıyla aynı bağlı çiftçiler — sera bazlı örnek raporlar */
const engineerLinkedFarmerReports: ReportItem[] = [
  {
    id: 'eng-hasan-1',
    title: 'Domates sera su stresi özeti',
    date: '2026-03-22',
    plant: 'Domates - Sera A',
    farmerName: 'Hasan Tat',
    score: 88,
    source: 'sample',
    status: 'Tamamlandı',
  },
  {
    id: 'eng-hasan-2',
    title: 'Elektriksel sinyal haftalık özeti',
    date: '2026-03-15',
    plant: 'Domates - Sera A',
    farmerName: 'Hasan Tat',
    score: 84,
    source: 'sample',
    status: 'İnceleniyor',
  },
  {
    id: 'eng-hamza-1',
    title: 'Biber sinyal ve nem korelasyonu',
    date: '2026-03-21',
    plant: 'Biber - Sera B',
    farmerName: 'Hamza Türer',
    score: 76,
    source: 'sample',
    status: 'İnceleniyor',
  },
  {
    id: 'eng-hamza-2',
    title: 'Sera iklim denge raporu',
    date: '2026-03-14',
    plant: 'Biber - Sera B',
    farmerName: 'Hamza Türer',
    score: 81,
    source: 'sample',
    status: 'Tamamlandı',
  },
  {
    id: 'eng-oguzhan-1',
    title: 'Salatalık nem dalgası uyarısı',
    date: '2026-03-19',
    plant: 'Salatalık - Sera C',
    farmerName: 'Oğuzhan Çetin',
    score: 62,
    source: 'sample',
    status: 'Uyarı',
  },
  {
    id: 'eng-oguzhan-2',
    title: 'Haftalık verim göstergeleri',
    date: '2026-03-12',
    plant: 'Salatalık - Sera C',
    farmerName: 'Oğuzhan Çetin',
    score: 79,
    source: 'sample',
    status: 'Tamamlandı',
  },
];

/** Mühendisin kendi sahada ürettiği / derlediği örnek raporlar (çiftçi değil) */
const engineerOwnReports: ReportItem[] = [
  {
    id: 'eng-self-1',
    title: 'Çoklu prob karşılaştırma — Saha oturumu 12 Mart',
    date: '2026-03-12',
    plant: 'Doğrudan ölçüm · Prob A1–A3',
    score: 93,
    source: 'sample',
    status: 'Tamamlandı',
  },
  {
    id: 'eng-self-2',
    title: 'Kalibrasyon ve SNR denetim raporu',
    date: '2026-03-10',
    plant: 'Ekipman · Kalibrasyon',
    score: 90,
    source: 'sample',
    status: 'Tamamlandı',
  },
  {
    id: 'eng-self-3',
    title: 'Ham veri özeti — frekans bandı analizi',
    date: '2026-03-08',
    plant: 'Ham kayıt · Oturum #47',
    score: 72,
    source: 'sample',
    status: 'İnceleniyor',
  },
];

const engineerFarmerMeta = [
  {
    id: 'hasan-tat',
    farmerName: 'Hasan Tat',
    greenhouseLabel: 'Hasan Tat · Sera A',
    crop: 'Domates · 420 m²',
    accent: '#059669',
  },
  {
    id: 'hamza-turer',
    farmerName: 'Hamza Türer',
    greenhouseLabel: 'Hamza Türer · Sera B',
    crop: 'Biber · 380 m²',
    accent: '#2563eb',
  },
  {
    id: 'oguzhan-cetin',
    farmerName: 'Oğuzhan Çetin',
    greenhouseLabel: 'Oğuzhan Çetin · Sera C',
    crop: 'Salatalık · 510 m²',
    accent: '#d97706',
  },
] as const;

function getStatusBadge(status: ReportStatus): string {
  if (status === 'Tamamlandı') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'İnceleniyor') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
}

function scoreTextColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  return 'text-yellow-600';
}

function sortReportsByDateDesc(items: ReportItem[]): ReportItem[] {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

type ReportsMode = 'ciftci' | 'muhendis';

type ReportsProps = {
  mode?: ReportsMode;
};

export function Reports({ mode = 'ciftci' }: ReportsProps) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailReport, setDetailReport] = useState<ReportItem | null>(null);
  const [selectedFarmerKey, setSelectedFarmerKey] = useState<
    (typeof engineerFarmerMeta)[number]['id']
  >('hasan-tat');

  const loadReports = useCallback((withRefreshState = false) => {
    if (withRefreshState) setIsRefreshing(true);
    setLoading(true);

    const run = async () => {
      const cached = localStorage.getItem(REPORTS_STORAGE_KEY);
      let cachedItems: ReportItem[] = [];
      try {
        const parsed = cached ? JSON.parse(cached) : [];
        cachedItems = Array.isArray(parsed) ? parsed : [];
      } catch {
        cachedItems = [];
      }

      let cloudApi: ReportItem[] = [];
      const profile = getStoredUserProfile();
      const fbUid = getCurrentFirebaseUid();
      if (
        isFirebaseConfigured() &&
        profile &&
        fbUid &&
        profile.uid === fbUid
      ) {
        try {
          cloudApi = await fetchReportFilesForSessionUser({
            uid: profile.uid,
            role: profile.role,
          });
        } catch {
          cloudApi = [];
        }
      }

      const localApiOnly = cachedItems.filter((r) => r.source === 'api');
      const apiMerged = mergeCloudAndLocalApiReports(cloudApi, localApiOnly);

      let merged: ReportItem[];

      if (mode === 'muhendis') {
        merged = [...engineerLinkedFarmerReports, ...engineerOwnReports, ...apiMerged].reduce<
          ReportItem[]
        >((acc, item) => {
          if (!acc.some((report) => report.id === item.id)) acc.push(item);
          return acc;
        }, []);
      } else {
        const nonApi = cachedItems.filter((r) => r.source !== 'api');
        merged = [...sampleReports, ...apiMerged, ...nonApi].reduce<ReportItem[]>((acc, item) => {
          if (!acc.some((report) => report.id === item.id)) acc.push(item);
          return acc;
        }, []);
        const persistList = merged.filter((r) => !r.cloudId);
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(persistList));
      }

      setReports(merged);
      setLoading(false);
      if (withRefreshState) setIsRefreshing(false);
    };

    void run();
  }, [mode]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const onReportsUpdated = () => loadReports(false);
    window.addEventListener(REPORTS_UPDATED_EVENT, onReportsUpdated);
    return () => window.removeEventListener(REPORTS_UPDATED_EVENT, onReportsUpdated);
  }, [loadReports]);

  useEffect(() => {
    setDetailReport(null);
  }, [mode]);

  const farmerReportsList = useMemo(
    () => reports.filter((r) => r.farmerName !== undefined && r.farmerName !== ''),
    [reports],
  );
  const ownReportsList = useMemo(
    () => reports.filter((r) => !r.farmerName),
    [reports],
  );

  const stats = useMemo(() => {
    const fr = reports.filter((r) => r.farmerName !== undefined && r.farmerName !== '');
    const own = reports.filter((r) => !r.farmerName);
    const averageScore = reports.length
      ? Math.round(reports.reduce((sum, item) => sum + item.score, 0) / reports.length)
      : 0;

    return {
      total: reports.length,
      averageScore,
      farmerReportTotal: fr.length,
      ownReportTotal: own.length,
    };
  }, [reports]);

  const selectedFarmerMeta =
    engineerFarmerMeta.find((m) => m.id === selectedFarmerKey) ?? engineerFarmerMeta[0];
  const selectedFarmerReports = sortReportsByDateDesc(
    farmerReportsList.filter((r) => r.farmerName === selectedFarmerMeta.farmerName),
  );

  const openable = (r: ReportItem) => Boolean(r.reportMarkdown?.trim() || r.signalChart?.values?.length);

  const renderReportTableRows = (
    list: ReportItem[],
    showFarmerColumn: boolean,
    onSelect?: (r: ReportItem) => void,
  ) =>
    list.map((report) => (
      <tr
        key={report.id}
        role={openable(report) && onSelect ? 'button' : undefined}
        tabIndex={openable(report) && onSelect ? 0 : undefined}
        onClick={() => openable(report) && onSelect?.(report)}
        onKeyDown={(e) => {
          if (!openable(report) || !onSelect) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(report);
          }
        }}
        className={`border-b border-gray-100 hover:bg-gray-50 ${
          openable(report) && onSelect ? 'cursor-pointer' : ''
        } ${detailReport?.id === report.id ? 'bg-emerald-50/60' : ''}`}
      >
        <td className="py-3 px-4">
          <p className="text-sm font-medium text-gray-900">{report.title}</p>
          <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-1 gap-y-1">
            <span>
              Kaynak: {report.source === 'api' ? 'Plant Analyzer' : 'Örnek'}
              {report.analyzerDurum ? ` · Durum: ${report.analyzerDurum}` : ''}
              {openable(report) && onSelect ? ' · Ayrıntı için tıklayın' : ''}
            </span>
            {report.source === 'api' && report.storageBackend === 'cloud' ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-sky-200 bg-sky-50 text-sky-800">
                Bulut dosyası
              </span>
            ) : null}
            {report.source === 'api' && report.storageBackend === 'local' ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-900">
                Yerel
              </span>
            ) : null}
          </p>
          {report.source === 'api' && report.reportFileName ? (
            <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1.5 min-w-0">
              <FileText className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
              <span className="truncate font-mono" title={report.reportFileName}>
                {report.reportFileName}
              </span>
            </p>
          ) : null}
        </td>
        {showFarmerColumn && (
          <td className="py-3 px-4 text-sm text-gray-900">{report.farmerName ?? '—'}</td>
        )}
        <td className="py-3 px-4 text-sm text-gray-900">{report.plant}</td>
        <td className="py-3 px-4 text-sm text-gray-900">{report.date}</td>
        <td className={`py-3 px-4 text-sm font-semibold ${scoreTextColor(report.score)}`}>
          %{report.score}
        </td>
        <td className="py-3 px-4">
          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(report.status)}`}>
            {report.status}
          </span>
        </td>
      </tr>
    ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Raporlar</h1>
            <p className="text-gray-600 mt-1">
            {mode === 'muhendis'
              ? 'Bağlı çiftçilerin sera raporları, kendi ölçümleriniz; analyzer raporları Firebase’de dosya olarak da saklanabilir'
              : 'Örnek raporlar ve analyzer çıktıları; Firebase yapılandırıldıysa .md rapor dosyası bulutta da tutulur'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadReports(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Veriyi Yenile
        </button>
      </div>

      {mode === 'muhendis' ? (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Çiftçi raporları</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.farmerReportTotal}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kendi raporlarım</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ownReportTotal}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ortalama skor (tümü)</p>
                  <p className="text-2xl font-bold text-gray-900">%{stats.averageScore}</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500 bg-white rounded-xl border border-gray-200">
              Raporlar yükleniyor...
            </div>
          ) : (
            <div className="space-y-10">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Çiftçi raporları</h2>
                    <p className="text-sm text-gray-500">
                      Her çiftçinin kendi serasında ürettiği analiz özetleri (örnek)
                    </p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-4">
                  {engineerFarmerMeta.map((meta) => {
                    const rows = sortReportsByDateDesc(
                      farmerReportsList.filter((r) => r.farmerName === meta.farmerName),
                    );
                    const avg =
                      rows.length > 0
                        ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length)
                        : 0;
                    const latest = rows[0];
                    return (
                      <button
                        key={meta.id}
                        type="button"
                        onClick={() => setSelectedFarmerKey(meta.id)}
                        className={`text-left rounded-xl border-2 bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                          selectedFarmerKey === meta.id
                            ? 'border-green-600 ring-2 ring-green-600/20'
                            : 'border-gray-200'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{meta.farmerName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Home className="w-3.5 h-3.5 shrink-0" />
                          {meta.greenhouseLabel}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{meta.crop}</p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-500">{rows.length} rapor</span>
                          <span className="font-semibold tabular-nums" style={{ color: meta.accent }}>
                            Ort. %{avg}
                          </span>
                        </div>
                        {latest && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            Son: {latest.title}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Seçili çiftçi raporları</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium text-gray-900">{selectedFarmerMeta.farmerName}</span>
                      {' — '}
                      {selectedFarmerMeta.greenhouseLabel}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Rapor
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Bitki/Alan
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Tarih
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Skor
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Durum
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderReportTableRows(selectedFarmerReports, false, setDetailReport)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-gray-200 pt-10">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Kendi raporlarım</h2>
                    <p className="text-sm text-gray-500">
                      Sahada yaptığınız ölçümlerden derlenen raporlar (örnek)
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Liste</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Database className="w-4 h-4" />
                      Örnek veri
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Rapor
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Kapsam
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Tarih
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Skor
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Durum
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderReportTableRows(
                          sortReportsByDateDesc(ownReportsList),
                          false,
                          setDetailReport,
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Toplam Rapor</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ortalama Skor</p>
                  <p className="text-2xl font-bold text-gray-900">%{stats.averageScore}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Rapor Listesi</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Database className="w-4 h-4" />
                Yerel + (Firebase ile) bulut rapor dosyası
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-gray-500">Raporlar yükleniyor...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Rapor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Bitki/Alan
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tarih</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Skor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderReportTableRows(sortReportsByDateDesc(reports), false, setDetailReport)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {detailReport && (detailReport.reportMarkdown || detailReport.signalChart) && (
        <div className="rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 border-b border-gray-200 bg-emerald-50/40">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Rapor ayrıntısı</h3>
              <p className="text-xs text-gray-600 mt-0.5">{detailReport.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setDetailReport(null)}
              className="text-sm text-emerald-800 hover:underline self-start sm:self-auto"
            >
              Kapat
            </button>
          </div>
          <div className="p-5 space-y-8">
            {detailReport.signalChart && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Sinyal grafiği (signal_chart)</h4>
                <p className="text-xs text-gray-500">
                  Analyzer çıktısındaki bin ortalaması; ham CSV ile aynı analiz oturumuna aittir.
                </p>
                <ReportSignalCharts chart={detailReport.signalChart} />
              </div>
            )}
            {detailReport.reportMarkdown && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Rapor dosyası</h4>
                <ReportMarkdownDocument
                  markdown={detailReport.reportMarkdown}
                  fileName={
                    detailReport.reportFileName ??
                    `Bitki_Raporu_${detailReport.date.replace(/[^\d-]/g, '') || 'tarih'}.md`
                  }
                  subtitle={detailReport.plant}
                  firebaseStorageUrl={detailReport.reportStorageDownloadUrl}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
