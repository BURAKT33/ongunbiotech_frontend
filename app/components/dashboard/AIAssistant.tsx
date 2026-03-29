import { useState } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, Droplets, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Merhaba! Ben PlantSignal AI Asistanınızım. Bitkilerinizin verilerini analiz ederek size önerilerde bulunabilirim. Nasıl yardımcı olabilirim?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Mock AI yanıtları - gerçek uygulamada burada bir LLM API çağrısı yapılır
  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('sulama') || lowerMessage.includes('su')) {
      return 'Verilerinize göre, Sera B bölümündeki domates bitkilerinizin toprak nem seviyesi %38 seviyesinde. Bu optimal değerin (%45-55) altında. Önümüzdeki 6-8 saat içinde sulama yapmanızı öneriyorum. Elektriksel sinyal verileri de bitkilerinizin su stresinde olduğunu gösteriyor (85 mV - yüksek sinyal seviyesi).';
    }

    if (lowerMessage.includes('sıcaklık') || lowerMessage.includes('ısı')) {
      return 'Sera sıcaklığınız 25°C seviyesinde ve domates bitkileri için optimal aralıkta (22-28°C). Ancak öğlen saatlerinde 28°C\'yi aşmaması için havalandırma sistemini kontrol etmenizi öneririm. Yüksek sıcaklık elektriksel sinyal değerlerini olumsuz etkileyebilir.';
    }

    if (lowerMessage.includes('sağlık') || lowerMessage.includes('durum')) {
      return 'Bitkilerinizin genel sağlık skoru 92/100 seviyesinde, bu çok iyi bir değer! Ancak dikkat edilmesi gereken noktalar:\n\n1. Sera B\'deki bitkilerde hafif su stresi var\n2. Işık seviyeleri optimal\n3. Besin dengesi iyi durumda\n4. Hastalık belirtisi gözlenmiyor\n\nÖnerim: Sulama zamanlamasını düzenleyin ve 2-3 gün içinde yaprak analizi yapın.';
    }

    if (lowerMessage.includes('verim') || lowerMessage.includes('hasat')) {
      return 'Elektriksel sinyal verilerinize göre, domates bitkileriniz aktif büyüme fazında. Mevcut koşullar devam ederse:\n\n- İlk hasat: 2-3 hafta içinde\n- Tahmini verim: Bitki başına 3-4 kg\n- Kalite: Yüksek (elektriksel sinyal stabilitesi iyi)\n\nVerimi artırmak için potasyum gübrelemesi yapabilirsiniz.';
    }

    if (lowerMessage.includes('gübre') || lowerMessage.includes('besin')) {
      return 'Elektriksel sinyal analizlerine göre, bitkilerinizin besin durumu iyi seviyede. Ancak gelecek hafta için şu gübreleme programını öneriyorum:\n\n1. Azot (N): Orta seviye - haftada 2 kez\n2. Fosfor (P): Yüksek seviye - çiçeklenme için\n3. Potasyum (K): Yüksek seviye - meyve gelişimi için\n\nVerilere göre pH dengesi optimal, ek düzenleme gerekmiyor.';
    }

    // Genel yanıt
    return 'Sorunuzu daha iyi anlayabilmem için daha fazla detay verebilir misiniz? Size şu konularda yardımcı olabilirim:\n\n- Sulama zamanlaması ve su yönetimi\n- Sıcaklık ve çevre koşulları\n- Bitki sağlığı ve hastalık tespiti\n- Gübreleme önerileri\n- Verim tahminleri\n- Genel bitki bakımı\n\nHangi konuda yardıma ihtiyacınız var?';
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Kullanıcı mesajını ekle
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // AI yanıtını simüle et (2 saniye gecikme)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    { icon: Droplets, text: 'Ne zaman sulama yapmalıyım?' },
    { icon: TrendingUp, text: 'Verim tahminini göster' },
    { icon: AlertCircle, text: 'Kritik uyarılar var mı?' },
    { icon: Sparkles, text: 'Genel sağlık durumu nedir?' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Asistan</h1>
        <p className="text-gray-600 mt-1">Verileriniz hakkında soru sorun ve akıllı öneriler alın</p>
      </div>

      {/* AI Info Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Yapay Zeka Destekli Analiz</h3>
            <p className="text-sm text-gray-700 mb-3">
              AI asistanımız, bitkilerinizden toplanan elektriksel sinyal verilerini, çevresel koşulları 
              ve geçmiş verileri analiz ederek size özel öneriler sunar.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-3 py-1 bg-white border border-green-200 rounded-full text-green-700">
                Real-time Analiz
              </span>
              <span className="text-xs px-3 py-1 bg-white border border-green-200 rounded-full text-green-700">
                Tahminleme
              </span>
              <span className="text-xs px-3 py-1 bg-white border border-green-200 rounded-full text-green-700">
                Öneri Sistemi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Hızlı Sorular</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickQuestions.map((question, index) => {
            const Icon = question.icon;
            return (
              <button
                key={index}
                onClick={() => setInputMessage(question.text)}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{question.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col" style={{ height: '500px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {message.role === 'assistant' ? (
                  <Bot className="w-5 h-5 text-green-600" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-green-600 text-white'
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'assistant' ? 'text-gray-500' : 'text-green-100'
                  }`}>
                    {message.timestamp.toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-green-600" />
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Sorunuzu yazın... (Örnek: Ne zaman sulama yapmalıyım?)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none resize-none"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
