import { ImageWithFallback } from './figma/ImageWithFallback';
import { Activity, Zap, Wifi } from 'lucide-react';

export function Technology() {
  return (
    <section id="teknoloji" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Nasıl Çalışır?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Biyo-elektriksel sinyal teknolojimiz, bitkilerin doğal elektriksel aktivitelerini 
            ölçerek sağlık durumlarını anlamamızı sağlar.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <ImageWithFallback
              src="/images/WhatsApp Image 2026-02-09 at 16.14.23(1).jpeg"
              alt="Bitki Yaprakları Yakın Çekim"
              className="rounded-2xl shadow-xl w-full h-auto"
            />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Elektriksel Sinyal Ölçümü
                </h3>
                <p className="text-gray-600">
                  Hassas sensörlerimiz bitkilerin hücresel seviyedeki elektriksel aktivitelerini 
                  gerçek zamanlı olarak ölçer ve analiz eder.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Yapay Zeka Analizi
                </h3>
                <p className="text-gray-600">
                  Toplanan veriler yapay zeka algoritmaları ile işlenerek bitkinin su ihtiyacı, 
                  besin eksikliği ve stres seviyeleri belirlenir.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Wifi className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Bulut Tabanlı İzleme
                </h3>
                <p className="text-gray-600">
                  Tüm veriler bulut sistemimizde saklanır ve mobil veya web uygulaması 
                  üzerinden istediğiniz yerden erişebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              1
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Sensör Yerleştirme</h4>
            <p className="text-sm text-gray-600">
              Bitkiye zarar vermeden sensörleri yerleştirin
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              2
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Veri Toplama</h4>
            <p className="text-sm text-gray-600">
              7/24 elektriksel sinyaller toplanır
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              3
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Analiz</h4>
            <p className="text-sm text-gray-600">
              Yapay zeka verilerinizi analiz eder
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              4
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Bildirimler</h4>
            <p className="text-sm text-gray-600">
              Anında uyarı ve öneriler alın
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
