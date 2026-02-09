import { Droplets, Thermometer, Heart, TrendingUp, Bell, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export function Features() {
  const features = [
    {
      icon: Droplets,
      title: 'Su İhtiyacı Tespiti',
      description: 'Bitkinizin tam olarak ne zaman sulamaya ihtiyacı olduğunu öğrenin. Aşırı veya az sulama problemlerini ortadan kaldırın.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Thermometer,
      title: 'Çevre Koşulları İzleme',
      description: 'Sıcaklık, nem ve ışık seviyelerini izleyerek optimal büyüme koşullarını sağlayın.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Heart,
      title: 'Sağlık Durumu Analizi',
      description: 'Bitki sağlığını gerçek zamanlı olarak takip edin ve hastalıkları erken tespit edin.',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: TrendingUp,
      title: 'Büyüme Takibi',
      description: 'Bitkinizin büyüme eğilimlerini ve gelişim aşamalarını detaylı raporlarla izleyin.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Bell,
      title: 'Akıllı Bildirimler',
      description: 'Kritik durumlarda anında bildirim alın. Mobil ve e-posta uyarıları ile her zaman haberdar olun.',
      gradient: 'from-purple-500 to-violet-500',
    },
    {
      icon: Shield,
      title: 'Stres Seviyesi Ölçümü',
      description: 'Bitkilerinizin stres seviyelerini ölçerek zamanında müdahale edin ve kayıpları önleyin.',
      gradient: 'from-amber-500 to-yellow-500',
    },
  ];

  return (
    <section id="ozellikler" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            Güçlü Özellikler
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Bitkileriniz İçin{' '}
            <span className="text-green-600">Tam Kontrol</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Bitkilerinizin sağlıklı büyümesi için ihtiyacınız olan tüm araçlar, tek bir platformda
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                {/* Background glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500`}></div>
                
                {/* Card */}
                <div className="relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-green-200 transition-all duration-300 h-full shadow-sm hover:shadow-xl">
                  {/* Icon with gradient background */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-xl blur-md`}></div>
                    <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Decorative element */}
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.gradient} w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl`}></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}