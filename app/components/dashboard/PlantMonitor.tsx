import { useState } from 'react';
import { Activity, Droplets, Thermometer, Sun, Wind, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Mock gerçek zamanlı veri
const realtimeData = [
  { time: '00:00', elektrik: 62, nem: 45 },
  { time: '04:00', elektrik: 58, nem: 48 },
  { time: '08:00', elektrik: 72, nem: 42 },
  { time: '12:00', elektrik: 85, nem: 38 },
  { time: '16:00', elektrik: 78, nem: 41 },
  { time: '20:00', elektrik: 70, nem: 44 },
  { time: 'Şimdi', elektrik: 85, nem: 38 },
];

// Bitki sağlık göstergeleri
const healthData = [
  { subject: 'Su', value: 65 },
  { subject: 'Besin', value: 85 },
  { subject: 'Işık', value: 90 },
  { subject: 'Sıcaklık', value: 88 },
  { subject: 'Nem', value: 70 },
  { subject: 'pH', value: 78 },
];

export function PlantMonitor() {
  const [selectedPlant, setSelectedPlant] = useState('domates-1');

  const plants = [
    { id: 'domates-1', name: 'Domates - Sera A, Sıra 1', status: 'healthy' },
    { id: 'biber-1', name: 'Biber - Sera A, Sıra 2', status: 'warning' },
    { id: 'domates-2', name: 'Domates - Sera B, Sıra 1', status: 'critical' },
    { id: 'salatalik-1', name: 'Salatalık - Sera B, Sıra 3', status: 'healthy' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Sağlıklı';
      case 'warning': return 'Dikkat';
      case 'critical': return 'Kritik';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bitki İzleme</h1>
        <p className="text-gray-600 mt-1">Bitkilerinizin detaylı verilerini izleyin</p>
      </div>

      {/* Plant Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Bitki Seçin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plants.map((plant) => (
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Elektriksel Sinyal</p>
              <p className="text-xl font-bold text-gray-900">85 mV</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <span className="text-green-600">↑ 12%</span> son 24 saatte
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Toprak Nemi</p>
              <p className="text-xl font-bold text-gray-900">38%</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <span className="text-red-600">↓ 8%</span> son 24 saatte
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Sıcaklık</p>
              <p className="text-xl font-bold text-gray-900">25°C</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <span className="text-gray-600">→</span> Stabil
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Işık Şiddeti</p>
              <p className="text-xl font-bold text-gray-900">8,500 lux</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <span className="text-green-600">↑ 5%</span> son 2 saatte
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wind className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Hava Nemi</p>
              <p className="text-xl font-bold text-gray-900">62%</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <span className="text-gray-600">→</span> Normal aralık
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Son Sulama</p>
              <p className="text-xl font-bold text-gray-900">18 saat</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            6 saat sonra önerilir
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
            <BarChart data={realtimeData}>
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

        {/* Sağlık Göstergeleri */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bitki Sağlık Göstergeleri
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={healthData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar 
                name="Sağlık Skoru" 
                dataKey="value" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
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
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">Bugün, 14:30</td>
                <td className="py-3 px-4 text-sm text-gray-900">85</td>
                <td className="py-3 px-4 text-sm text-gray-900">38</td>
                <td className="py-3 px-4 text-sm text-gray-900">25</td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">Bugün, 12:30</td>
                <td className="py-3 px-4 text-sm text-gray-900">82</td>
                <td className="py-3 px-4 text-sm text-gray-900">41</td>
                <td className="py-3 px-4 text-sm text-gray-900">26</td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">İyi</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">Bugün, 10:30</td>
                <td className="py-3 px-4 text-sm text-gray-900">78</td>
                <td className="py-3 px-4 text-sm text-gray-900">44</td>
                <td className="py-3 px-4 text-sm text-gray-900">24</td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">İyi</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">Bugün, 08:30</td>
                <td className="py-3 px-4 text-sm text-gray-900">72</td>
                <td className="py-3 px-4 text-sm text-gray-900">48</td>
                <td className="py-3 px-4 text-sm text-gray-900">22</td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Orta</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
