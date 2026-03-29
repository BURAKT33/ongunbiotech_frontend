import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Leaf,
  LogOut,
  BarChart3,
  Activity,
  MessageSquare,
  User,
  RefreshCw,
} from 'lucide-react';
import { PlantMonitor } from '../components/dashboard/PlantMonitor';
import { AIAssistant } from '../components/dashboard/AIAssistant';
import { Reports } from '../components/dashboard/Reports';
import { EngineerSignals } from '../components/dashboard/EngineerSignals';
import { ensureFirebaseSignedIn, firebaseSignOut } from '../lib/firebaseAuth';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  clearSessionStorage,
  getStoredRole,
  getStoredUserProfile,
  type UserRole,
} from '../lib/session';
import { DataSync } from '../components/dashboard/DataSync';

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'monitor' | 'ai' | 'reports' | 'sync'>('monitor');
  const [role, setRole] = useState<UserRole>('ciftci');
  const [headerName, setHeaderName] = useState('');
  const [headerEmail, setHeaderEmail] = useState('');

  useEffect(() => {
    setRole(getStoredRole());
    const p = getStoredUserProfile();
    if (p) {
      setHeaderName(p.displayName || p.email || '');
      setHeaderEmail(p.email || '');
    } else {
      setHeaderName('');
      setHeaderEmail('');
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    void ensureFirebaseSignedIn();
  }, []);

  const handleLogout = async () => {
    await firebaseSignOut();
    clearSessionStorage();
    navigate('/');
  };

  const isEngineer = role === 'muhendis';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-gray-900">PlantSignal</span>
                <p className="text-xs text-gray-500">
                  {isEngineer ? 'Mühendis Paneli' : 'Çiftçi Paneli'}
                </p>
              </div>
            </div>

            {/* Right Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {headerName ||
                      (isEngineer ? 'Mühendis' : 'Çiftçi')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {headerEmail ||
                      (isEngineer ? 'muhendis@firma.com' : 'ciftci@ciftlik.com')}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isEngineer ? 'bg-teal-100' : 'bg-green-100'
                  }`}
                >
                  <User className={`w-5 h-5 ${isEngineer ? 'text-teal-700' : 'text-green-600'}`} />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'monitor'
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">{isEngineer ? 'Sinyal Ölçümleri' : 'Bitki İzleme'}</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'ai'
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">AI Asistan</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'reports'
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">
                {isEngineer ? 'Çiftçi Raporları' : 'Raporlar'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'sync'
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-medium">Veri senkron</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around p-2">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg ${
                activeTab === 'monitor' ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="text-xs">{isEngineer ? 'Sinyal' : 'İzleme'}</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg ${
                activeTab === 'ai' ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">AI</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                activeTab === 'reports' ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Rapor</span>
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                activeTab === 'sync' ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-xs">Senkron</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'monitor' && (isEngineer ? <EngineerSignals /> : <PlantMonitor />)}
            {activeTab === 'ai' && <AIAssistant />}
            {activeTab === 'reports' && <Reports mode={isEngineer ? 'muhendis' : 'ciftci'} />}
            {activeTab === 'sync' && <DataSync />}
          </div>
        </main>
      </div>
    </div>
  );
}