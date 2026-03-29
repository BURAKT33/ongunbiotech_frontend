import { useState } from 'react';
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

/** Mühendise bağlı çiftçilerin kendi seralarında ölçtüğü örnek sinyaller */
const farmerGreenhouseSignals = [
  {
    id: 'hasan-tat',
    farmerName: 'Hasan Tat',
    greenhouseLabel: 'Hasan Tat · Sera A',
    crop: 'Domates · 420 m²',
    currentMv: 86,
    soilMoisture: 44,
    lastSync: '14:51',
    accent: '#059669',
    series: [
      { time: '08', mV: 72 },
      { time: '10', mV: 78 },
      { time: '12', mV: 84 },
      { time: '14', mV: 86 },
      { time: '16', mV: 82 },
    ],
  },
  {
    id: 'hamza-turer',
    farmerName: 'Hamza Türer',
    greenhouseLabel: 'Hamza Türer · Sera B',
    crop: 'Biber · 380 m²',
    currentMv: 74,
    soilMoisture: 38,
    lastSync: '14:48',
    accent: '#2563eb',
    series: [
      { time: '08', mV: 62 },
      { time: '10', mV: 68 },
      { time: '12', mV: 76 },
      { time: '14', mV: 74 },
      { time: '16', mV: 71 },
    ],
  },
  {
    id: 'oguzhan-cetin',
    farmerName: 'Oğuzhan Çetin',
    greenhouseLabel: 'Oğuzhan Çetin · Sera C',
    crop: 'Salatalık · 510 m²',
    currentMv: 69,
    soilMoisture: 52,
    lastSync: '14:44',
    accent: '#d97706',
    series: [
      { time: '08', mV: 58 },
      { time: '10', mV: 64 },
      { time: '12', mV: 71 },
      { time: '14', mV: 69 },
      { time: '16', mV: 67 },
    ],
  },
];

/** Her prob için günlük mV ve frekans oturumu (grafikler seçime göre değişir) */
const myProbeReadings = [
  {
    id: 'A1',
    label: 'Prob-12 Domates',
    mV: 84,
    snr: 22,
    updated: '14:42',
    tempC: 24,
    tempNote: 'Stabil',
    humidityPct: 58,
    humidityNote: 'Normal aralık',
    lastIrrigationHours: 14,
    irrigationNote: '4 saat sonra önerilir',
    signalTrend: { text: '↑ 9%', tone: 'up' as const, suffix: 'son 24 saatte' },
    sessionSeries: [
      { time: '09:00', mV: 72, freq: 12.0 },
      { time: '11:00', mV: 78, freq: 12.35 },
      { time: '13:00', mV: 86, freq: 12.85 },
      { time: '15:00', mV: 82, freq: 12.55 },
      { time: '17:00', mV: 80, freq: 12.38 },
    ],
  },
  {
    id: 'A2',
    label: 'Prob-07 Biber',
    mV: 71,
    snr: 19,
    updated: '14:38',
    tempC: 27,
    tempNote: 'Hafif yüksek',
    humidityPct: 48,
    humidityNote: 'Sera alt bandı',
    lastIrrigationHours: 22,
    irrigationNote: '2 saat içinde önerilir',
    signalTrend: { text: '↓ 4%', tone: 'down' as const, suffix: 'son 24 saatte' },
    sessionSeries: [
      { time: '09:00', mV: 58, freq: 11.88 },
      { time: '11:00', mV: 64, freq: 12.15 },
      { time: '13:00', mV: 74, freq: 12.58 },
      { time: '15:00', mV: 71, freq: 12.4 },
      { time: '17:00', mV: 67, freq: 12.05 },
    ],
  },
  {
    id: 'A3',
    label: 'Prob-03 Salatalık',
    mV: 63,
    snr: 17,
    updated: '14:35',
    tempC: 22,
    tempNote: 'Serin',
    humidityPct: 68,
    humidityNote: 'Yüksek nem',
    lastIrrigationHours: 9,
    irrigationNote: '8 saat sonra önerilir',
    signalTrend: { text: '→', tone: 'flat' as const, suffix: 'Son 6 saat stabil' },
    sessionSeries: [
      { time: '09:00', mV: 48, freq: 12.25 },
      { time: '11:00', mV: 54, freq: 12.42 },
      { time: '13:00', mV: 64, freq: 12.28 },
      { time: '15:00', mV: 61, freq: 12.02 },
      { time: '17:00', mV: 57, freq: 11.78 },
    ],
  },
];

export function EngineerSignals() {
  const [selectedFarmerId, setSelectedFarmerId] = useState(farmerGreenhouseSignals[0].id);
  const [selectedProbe, setSelectedProbe] = useState('A1');

  const selectedFarmer = farmerGreenhouseSignals.find((f) => f.id === selectedFarmerId) ?? farmerGreenhouseSignals[0];
  const activeProbe = myProbeReadings.find((p) => p.id === selectedProbe) ?? myProbeReadings[0];
  const probeSessionSeries = activeProbe.sessionSeries;

  const trendToneClass =
    activeProbe.signalTrend.tone === 'up'
      ? 'text-green-600'
      : activeProbe.signalTrend.tone === 'down'
        ? 'text-red-600'
        : 'text-gray-600';

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sinyaller</h1>
        <p className="text-gray-600 mt-1">
          Bağlı çiftçilerin seralarındaki ölçümler ile kendi sinyal kayıtlarınız tek ekranda
        </p>
      </div>

      {/* Çiftçi seraları */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Çiftçi sera sinyalleri</h2>
            <p className="text-sm text-gray-500">
              Her çiftçi kendi tesisindeki sensörlerle ölçüm paylaşıyor (örnek veri)
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {farmerGreenhouseSignals.map((fg) => (
            <button
              key={fg.id}
              type="button"
              onClick={() => setSelectedFarmerId(fg.id)}
              className={`text-left rounded-xl border-2 bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                selectedFarmerId === fg.id ? 'border-green-600 ring-2 ring-green-600/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{fg.farmerName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Home className="w-3.5 h-3.5 shrink-0" />
                    {fg.greenhouseLabel}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{fg.crop}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{fg.lastSync}</span>
              </div>
              <div className="flex gap-4 mb-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Anlık sinyal</span>
                  <p className="font-bold tabular-nums" style={{ color: fg.accent }}>
                    {fg.currentMv} mV
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Toprak nemi</span>
                  <p className="font-semibold text-gray-900 tabular-nums">%{fg.soilMoisture}</p>
                </div>
              </div>
              <div className="h-[120px] -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fg.series} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
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
              </div>
              <p className="text-xs text-gray-500 mt-2">Bugünkü elektriksel sinyal (saatlik özet)</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Seçili sera detayı</h3>
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-medium text-gray-900">{selectedFarmer.farmerName}</span>
            {' — '}
            {selectedFarmer.greenhouseLabel}. Çiftçi tarafından yüklenen ham ölçümlerin günlük seyri.
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedFarmer.series}>
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
                  stroke={selectedFarmer.accent}
                  strokeWidth={2}
                  dot={{ fill: selectedFarmer.accent }}
                  name="mV"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* — Kendi ölçümler — */}
      <section className="space-y-4 border-t border-gray-200 pt-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Kendi ölçtüğüm sinyaller</h2>
            <p className="text-sm text-gray-500">
              Doğrudan sizin kurduğunuz probalar ve saha oturumunuz
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Aktif probalar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {myProbeReadings.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProbe(p.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedProbe === p.id
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Activity
                    className={`w-5 h-5 ${selectedProbe === p.id ? 'text-teal-600' : 'text-gray-400'}`}
                  />
                  <span className="text-xs text-gray-500">{p.updated}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{p.label}</p>
                <p className="text-xs text-gray-600 mt-1">{p.mV} mV · SNR {p.snr} dB</p>
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Seçili prob için ortam ve sulama göstergeleri (çiftçi paneli referansı):{' '}
          <span className="font-medium text-gray-900">{activeProbe.label}</span>
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Elektriksel Sinyal</p>
                <p className="text-xl font-bold text-gray-900">{activeProbe.mV} mV</p>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <span className={trendToneClass}>{activeProbe.signalTrend.text}</span>{' '}
              {activeProbe.signalTrend.suffix}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sıcaklık</p>
                <p className="text-xl font-bold text-gray-900">{activeProbe.tempC}°C</p>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <span className="text-gray-600">→</span> {activeProbe.tempNote}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wind className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hava Nemi</p>
                <p className="text-xl font-bold text-gray-900">{activeProbe.humidityPct}%</p>
              </div>
            </div>
            <div className="text-xs text-gray-600">{activeProbe.humidityNote}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Son Sulama</p>
                <p className="text-xl font-bold text-gray-900">{activeProbe.lastIrrigationHours} saat</p>
              </div>
            </div>
            <div className="text-xs text-gray-600">{activeProbe.irrigationNote}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Günlük sinyal genliği (mV)</h3>
            <p className="text-sm text-gray-500 mb-4">{activeProbe.label} · seçili prob oturumu</p>
            <ResponsiveContainer width="100%" height={280} key={`bar-${selectedProbe}`}>
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
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Frekans izleme (Hz)</h3>
            <p className="text-sm text-gray-500 mb-4">{activeProbe.label} · seçili prob oturumu</p>
            <ResponsiveContainer width="100%" height={280} key={`line-${selectedProbe}`}>
              <LineChart data={probeSessionSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="freq" stroke="#4f46e5" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
