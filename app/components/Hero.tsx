import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Hero() {
  const farmingTypes = ['Geleneksel Tarım', 'Topraksız Tarım', 'Hidroponik Tarım', 'Sera Tarımı'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % farmingTypes.length);
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="anasayfa" className="pt-24 pb-16 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm">
              Yeni Nesil Bitki İzleme Teknolojisi
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Bitkilerinizin Sesini{' '}
              <span className="text-green-600">Duyun</span>
            </h1>
            
            <div className="min-h-[3rem] flex items-center">
              <p className="text-xl font-semibold text-green-700 transition-all duration-500">
                <span className={`inline-block transition-all duration-500 ${
                  isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}>
                  {farmingTypes[currentIndex]} için
                </span>
              </p>
            </div>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              Bitkilerden alınan elektriksel sinyaller ile bitki sağlığını gerçek zamanlı olarak 
              izleyin. İleri teknoloji sensörlerimiz sayesinde bitkilerinizin su, besin ve stres 
              seviyelerini hassas şekilde ölçün.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 group">
                Hemen Başlayın
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg hover:bg-green-50 transition-colors">
                Daha Fazla Bilgi
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div>
                <div className="text-3xl font-bold text-green-600">%99</div>
                <div className="text-sm text-gray-600">Doğruluk Oranı</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-gray-600">İzleme</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">1000+</div>
                <div className="text-sm text-gray-600">Mutlu Kullanıcı</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-600/10 rounded-3xl blur-3xl"></div>
            <ImageWithFallback
              src="/images/WhatsApp Image 2026-02-09 at 16.14.23.jpeg"
              alt="Bitki İzleme Teknolojisi"
              className="relative rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}