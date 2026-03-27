import { useEffect, useState } from 'react';
import { Activity, Thermometer, Wind, Calendar } from 'lucide-react';
import type { SignalChartPayload } from '../../lib/analyzerTypes';
import {
  readLastAnalysisSummary,
  readLatestApiSignalChart,
  REPORTS_UPDATED_EVENT,
  type LastAnalysisSummary,
} from '../../lib/persistAnalyzerReport';
import { ReportSignalCharts } from './ReportSignalCharts';
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

type PlantStatus = 'healthy' | 'warning' | 'critical';
type PlantTrend = {
  text: string;
  tone: 'up' | 'down' | 'flat';
  suffix: string;
};
type PlantSeriesPoint = {
  time: string;
  elektrik: number;
  nem: number;
};
type PlantHistoryRow = {
  timeLabel: string;
  elektrik: number;
  nem: number;
  sicaklik: number;
  statusText: string;
  statusTone: 'ok' | 'mid' | 'warn';
};
type PlantProfile = {
  id: string;
  name: string;
  status: PlantStatus;
  elektrikMv: number;
  elektrikTrend: PlantTrend;
  sicaklikC: number;
  sicaklikNote: string;
  havaNemiPct: number;
  havaNemiNote: string;
  sonSulamaSaat: number;
  sulamaNote: string;
  realtimeData: PlantSeriesPoint[];
  history: PlantHistoryRow[];
};

const plantProfiles: PlantProfile[] = [
  {
    id: 'domates-1',
    name: 'Domates - Sera A, Sıra 1',
    status: 'healthy',
    elektrikMv: 85,
    elektrikTrend: { text: '↑ 12%', tone: 'up', suffix: 'son 24 saatte' },
    sicaklikC: 25,
    sicaklikNote: 'Stabil',
    havaNemiPct: 62,
    havaNemiNote: 'Normal aralık',
    sonSulamaSaat: 18,
    sulamaNote: '6 saat sonra önerilir',
    realtimeData: [
      { time: '00:00', elektrik: 62, nem: 45 },
      { time: '04:00', elektrik: 58, nem: 48 },
      { time: '08:00', elektrik: 72, nem: 42 },
      { time: '12:00', elektrik: 85, nem: 38 },
      { time: '16:00', elektrik: 78, nem: 41 },
      { time: '20:00', elektrik: 70, nem: 44 },
      { time: 'Şimdi', elektrik: 85, nem: 38 },
    ],
    history: [
      { timeLabel: 'Bugün, 14:30', elektrik: 85, nem: 38, sicaklik: 25, statusText: 'Optimal', statusTone: 'ok' },
      { timeLabel: 'Bugün, 12:30', elektrik: 82, nem: 41, sicaklik: 26, statusText: 'İyi', statusTone: 'ok' },
      { timeLabel: 'Bugün, 10:30', elektrik: 78, nem: 44, sicaklik: 24, statusText: 'İyi', statusTone: 'ok' },
      { timeLabel: 'Bugün, 08:30', elektrik: 72, nem: 48, sicaklik: 22, statusText: 'Orta', statusTone: 'mid' },
    ],
  },
  {
    id: 'biber-1',
    name: 'Biber - Sera A, Sıra 2',
    status: 'warning',
    elektrikMv: 73,
    elektrikTrend: { text: '↓ 6%', tone: 'down', suffix: 'son 24 saatte' },
    sicaklikC: 27,
    sicaklikNote: 'Hafif yüksek',
    havaNemiPct: 54,
    havaNemiNote: 'Alt banda yakın',
    sonSulamaSaat: 22,
    sulamaNote: '2 saat içinde sulama önerilir',
    realtimeData: [
      { time: '00:00', elektrik: 68, nem: 55 },
      { time: '04:00', elektrik: 64, nem: 57 },
      { time: '08:00', elektrik: 72, nem: 53 },
      { time: '12:00', elektrik: 76, nem: 50 },
      { time: '16:00', elektrik: 71, nem: 52 },
      { time: '20:00', elektrik: 69, nem: 54 },
      { time: 'Şimdi', elektrik: 73, nem: 54 },
    ],
    history: [
      { timeLabel: 'Bugün, 14:30', elektrik: 73, nem: 54, sicaklik: 27, statusText: 'Dikkat', statusTone: 'mid' },
      { timeLabel: 'Bugün, 12:30', elektrik: 76, nem: 50, sicaklik: 28, statusText: 'Dikkat', statusTone: 'mid' },
      { timeLabel: 'Bugün, 10:30', elektrik: 74, nem: 52, sicaklik: 27, statusText: 'Orta', statusTone: 'mid' },
      { timeLabel: 'Bugün, 08:30', elektrik: 72, nem: 53, sicaklik: 26, statusText: 'İyi', statusTone: 'ok' },
    ],
  },
  {
    id: 'domates-2',
    name: 'Domates - Sera B, Sıra 1',
    status: 'critical',
    elektrikMv: 61,
    elektrikTrend: { text: '↓ 14%', tone: 'down', suffix: 'son 24 saatte' },
    sicaklikC: 30,
    sicaklikNote: 'Yüksek',
    havaNemiPct: 46,
    havaNemiNote: 'Düşük',
    sonSulamaSaat: 29,
    sulamaNote: 'Acil sulama önerilir',
    realtimeData: [
      { time: '00:00', elektrik: 69, nem: 49 },
      { time: '04:00', elektrik: 66, nem: 47 },
      { time: '08:00', elektrik: 64, nem: 46 },
      { time: '12:00', elektrik: 62, nem: 45 },
      { time: '16:00', elektrik: 60, nem: 44 },
      { time: '20:00', elektrik: 58, nem: 45 },
      { time: 'Şimdi', elektrik: 61, nem: 46 },
    ],
    history: [
      { timeLabel: 'Bugün, 14:30', elektrik: 61, nem: 46, sicaklik: 30, statusText: 'Kritik', statusTone: 'warn' },
      { timeLabel: 'Bugün, 12:30', elektrik: 62, nem: 45, sicaklik: 31, statusText: 'Kritik', statusTone: 'warn' },
      { timeLabel: 'Bugün, 10:30', elektrik: 64, nem: 46, sicaklik: 30, statusText: 'Dikkat', statusTone: 'mid' },
      { timeLabel: 'Bugün, 08:30', elektrik: 66, nem: 47, sicaklik: 29, statusText: 'Dikkat', statusTone: 'mid' },
    ],
  },
  {
    id: 'salatalik-1',
    name: 'Salatalık - Sera B, Sıra 3',
    status: 'healthy',
    elektrikMv: 79,
    elektrikTrend: { text: '↑ 5%', tone: 'up', suffix: 'son 24 saatte' },
    sicaklikC: 23,
    sicaklikNote: 'Uygun aralık',
    havaNemiPct: 68,
    havaNemiNote: 'Yüksek ama stabil',
    sonSulamaSaat: 12,
    sulamaNote: '8 saat sonra önerilir',
    realtimeData: [
      { time: '00:00', elektrik: 65, nem: 66 },
      { time: '04:00', elektrik: 67, nem: 67 },
      { time: '08:00', elektrik: 72, nem: 69 },
      { time: '12:00', elektrik: 77, nem: 68 },
      { time: '16:00', elektrik: 75, nem: 67 },
      { time: '20:00', elektrik: 76, nem: 68 },
      { time: 'Şimdi', elektrik: 79, nem: 68 },
    ],
    history: [
      { timeLabel: 'Bugün, 14:30', elektrik: 79, nem: 68, sicaklik: 23, statusText: 'İyi', statusTone: 'ok' },
      { timeLabel: 'Bugün, 12:30', elektrik: 77, nem: 68, sicaklik: 24, statusText: 'İyi', statusTone: 'ok' },
      { timeLabel: 'Bugün, 10:30', elektrik: 74, nem: 69, sicaklik: 23, statusText: 'Optimal', statusTone: 'ok' },
      { timeLabel: 'Bugün, 08:30', elektrik: 72, nem: 70, sicaklik: 22, statusText: 'Optimal', statusTone: 'ok' },
    ],
  },
];

export function PlantMonitor() {
  const [selectedPlant, setSelectedPlant] = useState('domates-1');
  const [lastSummary, setLastSummary] = useState<LastAnalysisSummary | null>(null);
  const [apiChart, setApiChart] = useState<SignalChartPayload | null>(null);

  useEffect(() => {
    const sync = () => {
      setLastSummary(readLastAnalysisSummary());
      setApiChart(readLatestApiSignalChart());
    };
    sync();
    window.addEventListener(REPORTS_UPDATED_EVENT, sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener(REPORTS_UPDATED_EVENT, sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const selectedPlantData = plantProfiles.find((p) => p.id === selectedPlant) ?? plantProfiles[0];

  const getStatusColor = (status: PlantStatus) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: PlantStatus) => {
    switch (status) {
      case 'healthy': return 'Sağlıklı';
      case 'warning': return 'Dikkat';
      case 'critical': return 'Kritik';
      default: return 'Bilinmiyor';
    }
  };

  const trendClass =
    selectedPlantData.elektrikTrend.tone === 'up'
      ? 'text-green-600'
      : selectedPlantData.elektrikTrend.tone === 'down'
        ? 'text-red-600'
        : 'text-gray-600';

  const rowStatusClass = (tone: PlantHistoryRow['statusTone']): string => {
    if (tone === 'warn') return 'bg-red-100 text-red-800';
    if (tone === 'mid') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bitki İzleme</h1>
        <p className="text-gray-600 mt-1">Bitkilerinizin detaylı verilerini izleyin</p>
      </div>

      {lastSummary && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            lastSummary.durum.toLowerCase().includes('köt') || lastSummary.durum.toLowerCase().includes('kotu')
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <p className="font-medium">Son sinyal analizi özeti</p>
          <p className="mt-1 text-gray-700">{lastSummary.title}</p>
          <p className="mt-1">
            <span className="text-gray-600">Durum:</span>{' '}
            <span className="font-semibold">{lastSummary.durum}</span>
            {lastSummary.stressScore != null && (
              <>
                {' '}
                · <span className="text-gray-600">Stres skoru:</span>{' '}
                <span className="font-mono tabular-nums">{lastSummary.stressScore.toFixed(2)}</span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Veri senkron ile yeni analiz yüklediğinizde güncellenir. Ayrıntılı rapor için Raporlar sekmesine gidin.
          </p>
        </div>
      )}

      {/* Plant Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Bitki Seçin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plantProfiles.map((plant) => (
            <button
              key={plant.id}
              onClick={() => setSelectedPlant(plant.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedPlant === plant.id
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className={`w-5 h-5 ${selectedPlant === plant.id ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(plant.status)}`}>
                  {getStatusText(plant.status)}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">{plant.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Elektriksel Sinyal</p>
              <p className="text-xl font-bold text-gray-900">{selectedPlantData.elektrikMv} mV</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <span className={trendClass}>{selectedPlantData.elektrikTrend.text}</span>{' '}
            {selectedPlantData.elektrikTrend.suffix}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Sıcaklık</p>
              <p className="text-xl font-bold text-gray-900">{selectedPlantData.sicaklikC}°C</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <span className="text-gray-600">→</span> {selectedPlantData.sicaklikNote}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wind className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Hava Nemi</p>
              <p className="text-xl font-bold text-gray-900">%{selectedPlantData.havaNemiPct}</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <span className="text-gray-600">→</span> {selectedPlantData.havaNemiNote}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Son Sulama</p>
              <p className="text-xl font-bold text-gray-900">{selectedPlantData.sonSulamaSaat} saat</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            {selectedPlantData.sulamaNote}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Günlük Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Günlük Trend (Elektriksel Sinyal)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={selectedPlantData.realtimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="elektrik" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gelen sinyaller — API signal_chart veya örnek çizgi */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Gelen sinyaller
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Seçilen bitkinin sensörden gelen elektriksel sinyal zaman serisi
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={selectedPlantData.realtimeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis
                stroke="#9ca3af"
                domain={['dataMin - 5', 'dataMax + 5']}
                label={{ value: 'mV', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="elektrik"
                name="Elektriksel (mV)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {apiChart && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <ReportSignalCharts chart={apiChart} title="Son analiz (genel) — signal_chart" />
            </div>
          )}
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Ölçümler</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Zaman</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Elektrik (mV)</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nem (%)</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sıcaklık (°C)</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Durum</th>
              </tr>
            </thead>
            <tbody>
              {selectedPlantData.history.map((row, idx) => (
                <tr key={row.timeLabel} className={`${idx < selectedPlantData.history.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.timeLabel}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.elektrik}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.nem}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.sicaklik}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${rowStatusClass(row.statusTone)}`}>
                      {row.statusText}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
