/**
 * Yerleşik üretim API (Cloud Run). `VITE_API_BASE_URL` ile override edilir.
 * Geliştirmede env boş → `/api/...` + Vite proxy; üretimde env yoksa bu adres kullanılır.
 */
const DEFAULT_PRODUCTION_API_BASE =
  'https://backend-service-635662286956.europe-west1.run.app';

/**
 * Backend kök URL’si.
 * - Üretim: önce `VITE_API_BASE_URL`; yoksa `DEFAULT_PRODUCTION_API_BASE`.
 * - Geliştirme: env boşsa `''` → `/api/...` proxy.
 */
export function getBackendApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '').trim();
  if (raw) return raw;
  if (import.meta.env.DEV) return '';
  return DEFAULT_PRODUCTION_API_BASE;
}

/** @deprecated İsim geçmiş uyumu; artık hata fırlatmaz — `getBackendApiBase()` kullanın. */
export function getApiBaseForAuthOrThrow(): string {
  return getBackendApiBase();
}
