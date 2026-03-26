import { useCallback, useRef, useState } from 'react';
import { Bluetooth, Upload, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { PlantAnalyzerResponse } from '../../lib/analyzerTypes';
import {
  getSignalAnalysisPostUrl,
  postSignalForAnalysis,
  usesBackendProxy,
} from '../../lib/plantAnalyzerApi';
import {
  appendReportToLocalStorage,
  buildReportItemFromAnalyzer,
  getDurumFromPayload,
  REPORTS_UPDATED_EVENT,
  saveLastAnalysisSummary,
} from '../../lib/persistAnalyzerReport';

/** Yaygın Nordic UART benzeri cihazlar için (bildirimle veri akışı) */
const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'.toLowerCase();
const UART_RX_NOTIFY_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'.toLowerCase();

type ConnKind = 'bluetooth' | null;

/** Dosya adı için güvenli taban (Bluetooth cihaz adı veya kısa id) */
function sanitizeBluetoothBaseName(name: string | undefined, deviceId: string): string {
  const fromName = (name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
  if (fromName.length > 0) return fromName;
  const short = deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  return short || 'cihaz';
}

/** Gelen baytlar UTF-8 CSV’ye benziyorsa csv, değilse bin */
function extensionFromBlePayload(bytes: Uint8Array): 'csv' | 'bin' {
  const n = Math.min(4096, bytes.length);
  if (n === 0) return 'bin';
  const slice = bytes.subarray(0, n);
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(slice);
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    const head = lines.slice(0, 5).join('\n');
    const hasDelimiter = /[,\t;]/.test(head);
    const hasNewline = lines.length >= 1;
    const mostlyPrintable = /^[\t\n\r\x20-\x7E\u00A0-\uFFFF]*$/u.test(head);
    if (hasDelimiter && hasNewline && mostlyPrintable) return 'csv';
  } catch {
    /* binary */
  }
  return 'bin';
}

function deriveFilenameFromBleData(device: BluetoothDevice, merged: Uint8Array): string {
  const base = sanitizeBluetoothBaseName(device.name, device.id);
  const ext = extensionFromBlePayload(merged);
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${base}_${ts}.${ext}`;
}

function getBluetooth(): Bluetooth | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { bluetooth?: Bluetooth }).bluetooth;
}

async function handleAnalyzerResponse(
  res: Response,
  logicalName?: string | null,
): Promise<{ ok: boolean; userMessage: string }> {
  const text = await res.text();
  let parsed: PlantAnalyzerResponse;
  try {
    parsed = JSON.parse(text) as PlantAnalyzerResponse;
  } catch {
    if (!res.ok) {
      return { ok: false, userMessage: `HTTP ${res.status}: ${text.slice(0, 240) || res.statusText}` };
    }
    return { ok: false, userMessage: 'Yanıt JSON değil; Plant Analyzer çıktısı bekleniyor.' };
  }

  if (!res.ok) {
    const errMsg =
      typeof (parsed as { error?: string }).error === 'string'
        ? (parsed as { error: string }).error
        : JSON.stringify(parsed).slice(0, 240);
    return { ok: false, userMessage: `Sunucu ${res.status}: ${errMsg}` };
  }

  if (parsed.ok === false) {
    const err = (parsed as { error?: unknown }).error;
    return {
      ok: false,
      userMessage: typeof err === 'string' ? err : 'Analiz servisi ok:false döndü.',
    };
  }

  const item = buildReportItemFromAnalyzer(parsed, { logicalFileName: logicalName });
  if (!item) {
    return { ok: false, userMessage: 'Yanıtta geçerli rapor metni yok.' };
  }

  appendReportToLocalStorage(item);
  saveLastAnalysisSummary(parsed, item.title);
  window.dispatchEvent(new Event(REPORTS_UPDATED_EVENT));

  const durum = getDurumFromPayload(parsed) ?? '—';
  return {
    ok: true,
    userMessage: `Analiz tamamlandı. Durum: ${durum}. Raporlar sekmesinden metin ve grafiği açabilirsiniz.`,
  };
}

export function DataSync() {
  const [connectionKind, setConnectionKind] = useState<ConnKind>(null);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [lastPulledName, setLastPulledName] = useState<string | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ble = getBluetooth();
  const bleSupported = Boolean(ble);

  const pickBluetooth = useCallback(() => {
    setConnectionKind('bluetooth');
    setMessage({ type: 'info', text: 'Bluetooth bağlantı tipi seçildi. Cihaz seçerek eşleştirin.' });
  }, []);

  const connectBluetooth = useCallback(async () => {
    if (!ble) {
      setMessage({
        type: 'err',
        text: 'Bu tarayıcı Web Bluetooth desteklemiyor (genelde Chrome / Edge, HTTPS gerekir).',
      });
      return;
    }
    setBusy('connect');
    setMessage(null);
    try {
      const d = await ble.requestDevice({
        optionalServices: [UART_SERVICE_UUID, 'battery_service'],
        acceptAllDevices: true,
      });
      setDevice(d);
      setConnectionKind('bluetooth');
      setMessage({ type: 'ok', text: `Cihaz seçildi: ${d.name ?? d.id}` });
    } catch (e) {
      const err = e as Error;
      if (err.name === 'NotFoundError') {
        setMessage({ type: 'info', text: 'Cihaz seçimi iptal edildi.' });
      } else {
        setMessage({ type: 'err', text: err.message || 'Bluetooth hatası' });
      }
    } finally {
      setBusy(null);
    }
  }, [ble]);

  const pullFromDevice = useCallback(async () => {
    if (!device || !device.gatt) {
      setMessage({ type: 'err', text: 'Önce Bluetooth ile bir cihaz seçin.' });
      return;
    }
    setBusy('pull');
    setMessage(null);
    const chunks: Uint8Array[] = [];

    try {
      const server = await device.gatt.connect();
      let service: BluetoothRemoteGATTService;
      try {
        service = await server.getPrimaryService(UART_SERVICE_UUID);
      } catch {
        setMessage({
          type: 'err',
          text:
            'Nordic UART servisi bulunamadı. Veriyi dosya olarak dışa aktarıp "Dosya yükle" ile gönderebilirsiniz.',
        });
        return;
      }
      const char = await service.getCharacteristic(UART_RX_NOTIFY_UUID);
      const onNotify = (ev: Event) => {
        const c = ev.target as BluetoothRemoteGATTCharacteristic;
        if (c.value?.buffer) {
          chunks.push(new Uint8Array(c.value.buffer));
        }
      };
      char.addEventListener('characteristicvaluechanged', onNotify);
      await char.startNotifications();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5000);
      });

      await char.stopNotifications();
      char.removeEventListener('characteristicvaluechanged', onNotify);

      const total = chunks.reduce((n, u) => n + u.byteLength, 0);
      const merged = new Uint8Array(total);
      let off = 0;
      for (const u of chunks) {
        merged.set(u, off);
        off += u.byteLength;
      }

      if (total === 0) {
        setMessage({
          type: 'info',
          text: '5 sn içinde veri gelmedi. Cihaz UART bildirimi göndermiyor olabilir; dosya yüklemeyi deneyin.',
        });
        return;
      }

      const ext = extensionFromBlePayload(merged);
      const mime = ext === 'csv' ? 'text/csv' : 'application/octet-stream';
      const blob = new Blob([merged], { type: mime });
      lastBlobRef.current = blob;
      const fname = deriveFilenameFromBleData(device, merged);
      setLastPulledName(fname);
      setMessage({
        type: 'ok',
        text: `${total} bayt okundu → ${fname}. Cloud Run’a gönderebilirsiniz.`,
      });
    } catch (e) {
      const err = e as Error;
      setMessage({ type: 'err', text: err.message || 'Cihazdan okuma başarısız.' });
    } finally {
      setBusy(null);
    }
  }, [device]);

  const uploadPulled = useCallback(async () => {
    const blob = lastBlobRef.current;
    if (!blob || !lastPulledName) {
      setMessage({ type: 'err', text: 'Önce cihazdan veri çekin veya dosya seçin.' });
      return;
    }
    setBusy('upload');
    setMessage(null);
    try {
      const res = await postSignalForAnalysis(blob, lastPulledName);
      const result = await handleAnalyzerResponse(res, lastPulledName);
      setMessage({ type: result.ok ? 'ok' : 'err', text: result.userMessage });
    } catch (e) {
      setMessage({ type: 'err', text: (e as Error).message || 'Ağ hatası (CORS veya erişim).' });
    } finally {
      setBusy(null);
    }
  }, [lastPulledName]);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('upload');
    setMessage(null);
    try {
      const res = await postSignalForAnalysis(file, file.name);
      const result = await handleAnalyzerResponse(res, file.name);
      setMessage({ type: result.ok ? 'ok' : 'err', text: result.userMessage });
    } catch (err) {
      setMessage({ type: 'err', text: (err as Error).message || 'Yükleme hatası' });
    } finally {
      setBusy(null);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Veri senkron</h1>
        <p className="text-gray-600 mt-1">
          Bluetooth ile cihazdan veri alın veya sinyal dosyasını analiz servisine yükleyin.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Bağlantı tipi</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={pickBluetooth}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
              connectionKind === 'bluetooth'
                ? 'border-green-600 bg-green-50 text-green-800'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bluetooth className="w-5 h-5" />
            Bluetooth
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Web Bluetooth için güvenli bağlam (HTTPS veya localhost) ve destekleyen tarayıcı gerekir.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Bluetooth cihaz</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            type="button"
            disabled={!bleSupported || busy !== null}
            onClick={connectBluetooth}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === 'connect' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bluetooth className="w-5 h-5" />}
            Bluetooth ile cihaz seç
          </button>
          <button
            type="button"
            disabled={!device || busy !== null}
            onClick={pullFromDevice}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === 'pull' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Cihazdan çek
          </button>
        </div>
        {device && (
          <p className="text-sm text-gray-600">
            Seçili cihaz: <span className="font-medium text-gray-900">{device.name ?? device.id}</span>
          </p>
        )}
        {!bleSupported && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Bu ortamda Web Bluetooth kullanılamıyor. Dosya yüklemeyi kullanın.
          </p>
        )}
        <p className="text-xs text-gray-500">
          “Cihazdan çek”, Nordic UART (NUS) bildirim karakteristiği üzerinden yaklaşık 5 saniye veri toplar.
          Farklı bir BLE profili için cihaz üreticisinin UUID bilgisi gerekir.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Cloud Run analiz</h2>
        <p className="text-xs text-gray-600 mb-1">
          Ham gövde (multipart yok). CSV için{' '}
          <code className="text-gray-800 bg-gray-100 px-1 rounded">Content-Type: text/csv</code> —{' '}
          Bluetooth’tan gelen veri CSV gibi algılanırsa aynı şekilde gönderilir; değilse{' '}
          <code className="text-gray-800 bg-gray-100 px-1 rounded">application/octet-stream</code>.
        </p>
        <p className="text-xs text-gray-600 mb-1">
          {usesBackendProxy()
            ? 'İstek Vercel’deki uygulamanızdan kendi Cloud Run API’nize (CORS) gidiyor; backend analyzer’a iletir.'
            : 'Doğrudan analyzer URL’sine gidiyor; tarayıcı CORS için analyzer’da izin gerekir.'}
        </p>
        <p className="text-xs text-gray-500 break-all font-mono">{getSignalAnalysisPostUrl()}</p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            type="button"
            disabled={busy !== null || !lastBlobRef.current}
            onClick={uploadPulled}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === 'upload' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Çekilen veriyi gönder
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            Dosya yükle
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,text/csv,text/plain,.txt"
            onChange={onFileChange}
          />
        </div>
        {lastPulledName && (
          <p className="text-xs text-gray-600">
            Bellekteki son çekim: <span className="font-medium">{lastPulledName}</span>
          </p>
        )}
      </div>

      {message && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            message.type === 'ok'
              ? 'bg-green-50 border-green-200 text-green-900'
              : message.type === 'err'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-gray-50 border-gray-200 text-gray-800'
          }`}
        >
          {message.type === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : message.type === 'err' ? (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-gray-500" />
          )}
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
      )}
    </div>
  );
}
