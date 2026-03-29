/**
 * Backend kök URL’si.
 * - Üretim (Vercel): `VITE_API_BASE_URL=https://....run.app` (sonunda / yok).
 * - Geliştirme: boş bırakılırsa `/api/...` kullanılır; Vite `VITE_DEV_BACKEND_URL` hedefine proxy’ler.
 */
export function getBackendApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return raw?.replace(/\/$/, '').trim() ?? '';
}

/**
 * Google backend doğrulaması: prod’da `VITE_API_BASE_URL` zorunlu; dev’de boş → `/api/auth/google` proxy.
 */
export function getApiBaseForAuthOrThrow(): string {
  const b = getBackendApiBase();
  if (b) return b;
  if (import.meta.env.DEV) return '';
  throw new Error('VITE_API_BASE_URL_not_set');
}
