import { Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import LogoImage from '../../Gemini_Generated_Image_uy7tfluy7tfluy7t(1).png';

export function Header() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-transparent flex items-center justify-center">
              <img
                src={LogoImage}
                alt="Ongun Biotech logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-xl font-semibold text-gray-900">Ongun Biotech</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/#anasayfa" className="text-gray-700 hover:text-green-600 transition-colors">
              Ana Sayfa
            </a>
            <a href="/#teknoloji" className="text-gray-700 hover:text-green-600 transition-colors">
              Teknoloji
            </a>
            <a href="/#ozellikler" className="text-gray-700 hover:text-green-600 transition-colors">
              Özellikler
            </a>
            <a href="/#iletisim" className="text-gray-700 hover:text-green-600 transition-colors">
              İletişim
            </a>
            <div className="relative">
              <button
                onClick={() => setLoginMenuOpen((prev) => !prev)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                Giriş Yap
                <ChevronDown className={`w-4 h-4 transition-transform ${loginMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {loginMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                  <button
                    onClick={() => {
                      navigate('/giris?rol=ciftci');
                      setLoginMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    Çiftçi Girişi
                  </button>
                  <button
                    onClick={() => {
                      navigate('/giris?rol=muhendis');
                      setLoginMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    Mühendis Girişi
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <a
                href="/#anasayfa"
                className="text-gray-700 hover:text-green-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ana Sayfa
              </a>
              <a
                href="/#teknoloji"
                className="text-gray-700 hover:text-green-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Teknoloji
              </a>
              <a
                href="/#ozellikler"
                className="text-gray-700 hover:text-green-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Özellikler
              </a>
              <a
                href="/#iletisim"
                className="text-gray-700 hover:text-green-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                İletişim
              </a>
              <button 
                onClick={() => {
                  navigate('/giris?rol=ciftci');
                  setMobileMenuOpen(false);
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-left"
              >
                Çiftçi Girişi
              </button>
              <button
                onClick={() => {
                  navigate('/giris?rol=muhendis');
                  setMobileMenuOpen(false);
                }}
                className="bg-white border border-green-600 text-green-700 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors text-left"
              >
                Mühendis Girişi
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}