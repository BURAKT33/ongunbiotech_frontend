import { getBackendApiBase } from './apiBase';

/**
 * Vercel (frontend) → kendi Cloud Run API’niz (proxy) veya doğrudan analyzer.
 * - Üretimde: VITE_API_BASE_URL=https://your-backend.run.app (CORS burada açılır)
 * - Geliştirme: VITE_API_BASE_URL boş → `/api/plant-analyze` (Vite → localhost:8080)
 * - Doğrud analyzer: yalnızca prod’da base yoksa; VITE_PLANT_ANALYZER_URL
 */
export const PLANT_ANALYZER_RUN_URL =
  import.meta.env.VITE_PLANT_ANALYZER_URL ??
  'https://plant-analyzer-635662286956.europe-west1.run.app/run';

export function getSignalAnalysisPostUrl(): string {
  const base = getBackendApiBase();
  if (base) return `${base}/api/plant-analyze`;
  if (import.meta.env.DEV) return '/api/plant-analyze';
  return PLANT_ANALYZER_RUN_URL;
}

export function usesBackendProxy(): boolean {
  return Boolean(getBackendApiBase()) || import.meta.env.DEV;
}

/**
 * Ham gövde ile analiz isteği. CSV: text/csv, diğer: octet-stream.
 */
export async function postSignalForAnalysis(
  body: Blob | File,
  logicalName?: string | null,
): Promise<Response> {
  const url = getSignalAnalysisPostUrl();
  const name = logicalName ?? (body instanceof File ? body.name : '') ?? '';
  const lower = name.toLowerCase();
  const asCsv =
    body.type === 'text/csv' ||
    body.type === 'text/plain' ||
    lower.endsWith('.csv');
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': asCsv ? 'text/csv' : 'application/octet-stream',
    },
    body,
  });
}
