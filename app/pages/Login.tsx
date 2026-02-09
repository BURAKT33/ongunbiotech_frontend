import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Leaf, LogIn } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basit demo giriş - gerçek uygulamada authentication yapılmalı
    if (email && password) {
      navigate('/panel');
    }
  };

  // Demo kullanıcı bilgileri ile otomatik doldur
  const fillDemoCredentials = () => {
    setEmail('ahmet@ciftlik.com');
    setPassword('demo123');
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Çiftçi Paneli</h1>
          <p className="text-gray-600">Bitkilerinizi izlemek için giriş yapın</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
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
                placeholder="ornek@ciftlik.com"
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
