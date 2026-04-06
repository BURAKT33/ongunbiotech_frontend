import { Leaf, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold">Ongun Biotech</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Bitkilerden alınan elektriksel sinyaller ile bitki sağlığını gerçek zamanlı 
              olarak izleyin. Gelecek nesil tarım teknolojisi.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <a href="#anasayfa" className="text-gray-400 hover:text-green-400 transition-colors">
                  Ana Sayfa
                </a>
              </li>
              <li>
                <a href="#teknoloji" className="text-gray-400 hover:text-green-400 transition-colors">
                  Teknoloji
                </a>
              </li>
              <li>
                <a href="#ozellikler" className="text-gray-400 hover:text-green-400 transition-colors">
                  Özellikler
                </a>
              </li>
              <li>
                <a href="#iletisim" className="text-gray-400 hover:text-green-400 transition-colors">
                  İletişim
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Kaynaklar</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  Dokümantasyon
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  SSS
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  Destek
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Ongun Biotech. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
