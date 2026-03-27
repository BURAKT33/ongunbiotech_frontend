import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Leaf, LogIn } from 'lucide-react';
import { setStoredRole, type UserRole } from '../lib/session';
import { loadGoogleIdentityScript, renderGoogleContinueButton } from '../lib/googleIdentity';
import { postGoogleCredential } from '../lib/authApi';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginRole: UserRole = useMemo(
    () => (searchParams.get('rol') === 'muhendis' ? 'muhendis' : 'ciftci'),
    [searchParams],
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const isEngineer = loginRole === 'muhendis';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setStoredRole(loginRole);
      navigate('/panel');
    }
  };

  const fillDemoCredentials = () => {
    if (isEngineer) {
      setEmail('deniz.yilmaz@plantsignal.com');
      setPassword('demo123');
    } else {
      setEmail('ahmet@ciftlik.com');
      setPassword('demo123');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      if (!clientId || !googleBtnRef.current) return;
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !googleBtnRef.current) return;
        renderGoogleContinueButton({
          container: googleBtnRef.current,
          clientId,
          onCredential: async (credential) => {
            setGoogleError(null);
            setGoogleBusy(true);
            try {
              const result = await postGoogleCredential(credential, loginRole);
              if (!result.ok) {
                setGoogleError(result.error);
                return;
              }
              const roleFromServer = result.user.role;
              setStoredRole(roleFromServer === 'muhendis' ? 'muhendis' : 'ciftci');
              navigate('/panel');
            } catch (e) {
              setGoogleError((e as Error).message || 'google_login_failed');
            } finally {
              setGoogleBusy(false);
            }
          },
        });
      } catch (e) {
        setGoogleError((e as Error).message || 'google_script_failed');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [loginRole, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">PlantSignal</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEngineer ? 'Mühendis Paneli' : 'Çiftçi Paneli'}
          </h1>
          <p className="text-gray-600">
            {isEngineer
              ? 'Bağlı çiftçilerin raporlarını ve sahadaki ölçümlerinizi yönetmek için giriş yapın'
              : 'Bitkilerinizi izlemek için giriş yapın'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center">
              <div className="w-full">
                <div
                  ref={googleBtnRef}
                  className={`w-full flex justify-center ${googleBusy ? 'opacity-70 pointer-events-none' : ''}`}
                />
              </div>
            </div>
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <p className="text-xs text-gray-500">
                Google butonu için <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> gerekli.
              </p>
            )}
            {googleError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Google giriş hatası: {googleError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400">veya</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                placeholder={isEngineer ? 'muhendis@firma.com' : 'ornek@ciftlik.com'}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-600" />
                <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
              </label>
              <a href="#" className="text-sm text-green-600 hover:text-green-700">
                Şifremi unuttum
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Giriş Yap
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Demo için:</strong> Aşağıdaki butona tıklayarak örnek kullanıcı bilgileriyle giriş yapabilirsiniz.
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Demo bilgilerini kullan
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu?{' '}
              <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                Kayıt olun
              </a>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Ana sayfaya dön
          </a>
        </div>
      </div>
    </div>
  );
}
