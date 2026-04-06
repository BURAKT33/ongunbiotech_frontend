import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Users,
  Home,
  Thermometer,
  Wind,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { SignalChartPayload } from '../../lib/analyzerTypes';
import type { ReportItem } from '../../lib/reportTypes';
import {
  fetchMergedApiReportsForSession,
  formatMonitorReportButtonLabel,
  latestSignalChartFromReportList,
  readLatestApiSignalChart,
  readMonitorCustomLabels,
  REPORTS_UPDATED_EVENT,
} from '../../lib/persistAnalyzerReport';
import { ReportSignalCharts } from './ReportSignalCharts';

const FARMER_ACCENTS = ['#059669', '#2563eb', '#d97706', '#7c3aed', '#dc2626'];

function sortReportsNewestFirst(list: ReportItem[]): ReportItem[] {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.createdAt || `${a.date}T12:00:00`) || 0;
    const tb = Date.parse(b.createdAt || `${b.date}T12:00:00`) || 0;
    return tb - ta || b.id.localeCompare(a.id);
  });
}

function chartToMvSeries(
  chart: SignalChartPayload | null | undefined,
  maxPoints = 20,
): { time: string; mV: number }[] {
  const v = chart?.values;
  if (!v?.length) return [];
  const slice = v.length > maxPoints ? v.slice(-maxPoints) : v;
  return slice.map((val, i) => ({
    time: `${i + 1}`,
    mV: typeof val === 'number' && Number.isFinite(val) ? val : 0,
  }));
}

function formatReportTime(r: ReportItem): string {
  const iso = r.createdAt || `${r.date}T12:00:00`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return r.date;
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function derivedSoilMoisture(r: ReportItem): number | null {
  if (typeof r.stressScore !== 'number' || !Number.isFinite(r.stressScore)) return null;
  return Math.round(Math.min(99, Math.max(0, 55 - r.stressScore * 8)));
}

type FarmerGroup = { farmerName: string; reports: ReportItem[]; accent: string };

type PlantStatus = 'healthy' | 'warning' | 'critical';

function reportStatusToPlantStatus(s: ReportItem['status']): PlantStatus {
  if (s === 'Uyarı') return 'critical';
  if (s === 'Tamamlandı') return 'healthy';
  return 'warning';
}

function getStatusColor(status: PlantStatus) {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusText(status: PlantStatus) {
  switch (status) {
    case 'healthy':
      return 'Sağlıklı';
    case 'warning':
      return 'Dikkat';
    case 'critical':
      return 'Kritik';
    default:
      return 'Bilinmiyor';
  }
}

export function EngineerSignals() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmerName, setSelectedFarmerName] = useState('');
  const [selectedOwnReportId, setSelectedOwnReportId] = useState('');
  const [ownChart, setOwnChart] = useState<SignalChartPayload | null>(null);
  const [monitorLabels, setMonitorLabels] = useState<Record<string, string>>(() =>
    readMonitorCustomLabels(),
  );

  useEffect(() => {
    const sync = async () => {
      setLoading(true);
      try {
        const list = await fetchMergedApiReportsForSession();
        setReports(list);
      } finally {
        setLoading(false);
      }
      setMonitorLabels(readMonitorCustomLabels());
    };
    void sync();
    const onSync = () => void sync();
    window.addEventListener(REPORTS_UPDATED_EVENT, onSync);
    window.addEventListener('focus', onSync);
    return () => {
      window.removeEventListener(REPORTS_UPDATED_EVENT, onSync);
      window.removeEventListener('focus', onSync);
    };
  }, []);

  const { farmerGroups, ownReports } = useMemo(() => {
    const apiOnly = reports.filter((r) => r.source === 'api');
    const withFarmer = apiOnly.filter((r) => r.farmerName?.trim());
    const own = apiOnly.filter((r) => !r.farmerName?.trim());
    const map = new Map<string, ReportItem[]>();
    for (const r of withFarmer) {
      const key = r.farmerName!.trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    const groups: FarmerGroup[] = [...map.entries()].map(([farmerName, reps], i) => ({
      farmerName,
      reports: sortReportsNewestFirst(reps),
      accent: FARMER_ACCENTS[i % FARMER_ACCENTS.length],
    }));
    groups.sort((a, b) => a.farmerName.localeCompare(b.farmerName, 'tr'));
    return { farmerGroups: groups, ownReports: sortReportsNewestFirst(own) };
  }, [reports]);

  useEffect(() => {
    setSelectedFarmerName((prev) => {
      if (farmerGroups.length === 0) return '';
      if (prev && farmerGroups.some((g) => g.farmerName === prev)) return prev;
      return farmerGroups[0].farmerName;
    });
  }, [farmerGroups]);

  useEffect(() => {
    setSelectedOwnReportId((prev) => {
      if (ownReports.length === 0) return '';
      if (prev && ownReports.some((r) => r.id === prev)) return prev;
      return ownReports[0].id;
    });
  }, [ownReports]);

  const selectedGroup = farmerGroups.find((g) => g.farmerName === selectedFarmerName) ?? null;
  const selectedFarmerLatest = selectedGroup?.reports[0] ?? null;
  const farmerLineData = chartToMvSeries(selectedFarmerLatest?.signalChart, 48);

  const activeOwnReport = ownReports.find((r) => r.id === selectedOwnReportId) ?? null;

  useEffect(() => {
    if (activeOwnReport?.signalChart?.values?.length) {
      setOwnChart(activeOwnReport.signalChart);
      return;
    }
    setOwnChart(latestSignalChartFromReportList(ownReports) ?? readLatestApiSignalChart());
  }, [activeOwnReport, ownReports]);

  const ownMoisture =
    activeOwnReport && typeof activeOwnReport.stressScore === 'number'
      ? Math.round(Math.min(99, Math.max(0, 55 - activeOwnReport.stressScore * 8)))
      : null;
  const probeSessionSeries = chartToMvSeries(ownChart ?? activeOwnReport?.signalChart, 24);

  const trendToneClass = 'text-gray-600';

  if (loading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sinyaller</h1>
          <p className="text-gray-500 mt-1">Yükleniyor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sinyaller</h1>
        <p className="text-gray-600 mt-1">
          Raporlar sekmesiyle aynı kaynaktan: bağlı çiftçilerin Analyzer oturumları ve kendi raporlarınız
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Çiftçi sera sinyalleri</h2>
            <p className="text-sm text-gray-500">
              Bağlı çiftçilerin yüklediği API raporları (çiftçi adına göre gruplanır)
            </p>
          </div>
        </div>

        {farmerGroups.length === 0 ? (
          <p className="text-sm text-gray-600 bg-white rounded-xl border border-gray-200 p-4">
            Henüz paylaşım üzerinden gelen Analyzer raporu yok. Raporlar sekmesinde görünen raporlar
            burada da listelenir; veri senkron veya yeni yükleme sonrası yenilenir.
          </p>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {farmerGroups.map((fg) => {
              const latest = fg.reports[0];
              const barData = chartToMvSeries(latest.signalChart, 20);
              const moisture = derivedSoilMoisture(latest);
              return (
                <button
                  key={fg.farmerName}
                  type="button"
                  onClick={() => setSelectedFarmerName(fg.farmerName)}
                  className={`text-left rounded-xl border-2 bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                    selectedFarmerName === fg.farmerName
                      ? 'border-green-600 ring-2 ring-green-600/20'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{fg.farmerName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Home className="w-3.5 h-3.5 shrink-0" />
                        {latest.plant || latest.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {fg.reports.length} oturum · {latest.date}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatReportTime(latest)}</span>
                  </div>
                  <div className="flex gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Sinyal skoru</span>
                      <p className="font-bold tabular-nums" style={{ color: fg.accent }}>
                        {latest.score} mV
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Türetilmiş nem</span>
                      <p className="font-semibold text-gray-900 tabular-nums">
                        {moisture != null ? `%${moisture}` : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="h-[120px] -mx-1">
                    {barData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} width={32} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="mV" fill={fg.accent} radius={[4, 4, 0, 0]} name="mV" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-500 h-full flex items-center justify-center">
                        Bu oturumda grafik yok
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Son oturum — sinyal özeti (bin)</p>
                </button>
              );
            })}
          </div>
        )}

        {selectedFarmerLatest && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Seçili çiftçi detayı</h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium text-gray-900">{selectedFarmerLatest.farmerName}</span>
              {' — '}
              {selectedFarmerLatest.plant || selectedFarmerLatest.title}. En güncel oturumun sinyal seyri.
            </p>
            <div className="h-[220px]">
              {farmerLineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={farmerLineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mV"
                      stroke={selectedGroup?.accent ?? '#059669'}
                      strokeWidth={2}
                      dot={{ fill: selectedGroup?.accent ?? '#059669' }}
                      name="mV"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">Bu oturumda çizilecek sinyal verisi yok.</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-gray-200 pt-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Kendi ölçtüğüm sinyaller</h2>
            <p className="text-sm text-gray-500">Sizin hesabınıza kayıtlı Analyzer API raporları</p>
          </div>
        </div>

        {ownReports.length === 0 ? (
          <p className="text-sm text-gray-600 bg-white rounded-xl border border-gray-200 p-4">
            Henüz kendi adınıza kayıtlı Analyzer oturumu yok. Veri senkron veya analiz yüklediğinizde burada
            görünür.
          </p>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Oturumlar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ownReports.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedOwnReportId(p.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedOwnReportId === p.id
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Activity
                        className={`w-5 h-5 ${selectedOwnReportId === p.id ? 'text-teal-600' : 'text-gray-400'}`}
                      />
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(
                          reportStatusToPlantStatus(p.status),
                        )}`}
                      >
                        {getStatusText(reportStatusToPlantStatus(p.status))}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {formatMonitorReportButtonLabel(p, monitorLabels)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {p.score} mV
                      {typeof p.stressScore === 'number' ? ` · Stres ${p.stressScore.toFixed(2)}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {activeOwnReport && (
              <>
                <p className="text-sm text-gray-600">
                  Seçili oturum:{' '}
                  <span className="font-medium text-gray-900">
                    {formatMonitorReportButtonLabel(activeOwnReport, monitorLabels)}
                  </span>
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Elektriksel Sinyal</p>
                        <p className="text-xl font-bold text-gray-900">{activeOwnReport.score} mV</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className={trendToneClass}>
                        {typeof activeOwnReport.stressScore === 'number'
                          ? `Stres ${activeOwnReport.stressScore.toFixed(2)}`
                          : '—'}
                      </span>{' '}
                      Analyzer
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Thermometer className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Durum</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">
                          {activeOwnReport.analyzerDurum || activeOwnReport.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">Analyzer özeti</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Wind className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Türetilmiş nem</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ownMoisture != null ? `${ownMoisture}%` : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">Stres skorundan türetilmiş gösterge</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tarih</p>
                        <p className="text-xl font-bold text-gray-900 tabular-nums">{activeOwnReport.date}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">{formatReportTime(activeOwnReport)}</div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Günlük sinyal genliği (mV)</h3>
                    <p className="text-sm text-gray-500 mb-4">Seçili oturum — bin özeti</p>
                    {probeSessionSeries.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280} key={`bar-${selectedOwnReportId}`}>
                        <BarChart data={probeSessionSeries}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="time" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="mV" fill="#0d9488" radius={[8, 8, 0, 0]} name="mV" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-gray-500">Grafik verisi yok.</p>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Sinyal analizi</h3>
                    <p className="text-sm text-gray-500">Oturumdaki signal_chart (Raporlar ile aynı)</p>
                    {ownChart && ownChart.values?.length ? (
                      <ReportSignalCharts chart={ownChart} />
                    ) : (
                      <p className="text-sm text-gray-500">Bu oturumda detaylı grafik yok.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
