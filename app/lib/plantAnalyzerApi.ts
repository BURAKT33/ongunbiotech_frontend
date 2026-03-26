/**
 * Vercel (frontend) → kendi Cloud Run API’niz (proxy) veya doğrudan analyzer.
 * - Üretimde: VITE_API_BASE_URL=https://your-backend.run.app (CORS burada açılır)
 * - Doğrud analyzer: VITE_PLANT_ANALYZER_URL (tarayıcı CORS’u analyzer’da açık olmalı)
 */
export const PLANT_ANALYZER_RUN_URL =
  import.meta.env.VITE_PLANT_ANALYZER_URL ??
  'https://plant-analyzer-635662286956.europe-west1.run.app/run';

export function getSignalAnalysisPostUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (base) return `${base}/api/plant-analyze`;
  return PLANT_ANALYZER_RUN_URL;
}

export function usesBackendProxy(): boolean {
  return Boolean(import.meta.env.VITE_API_BASE_URL?.trim());
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
