import { getBackendApiBase } from './apiBase';

export type GoogleAuthResult =
  | {
      ok: true;
      user: { id: string; email?: string; name?: string; picture?: string; role?: 'ciftci' | 'muhendis' };
    }
  | { ok: false; error: string };

export function getApiBaseOrThrow(): string {
  return getBackendApiBase();
}

export async function postGoogleCredential(
  credential: string,
  desiredRole?: 'ciftci' | 'muhendis',
): Promise<GoogleAuthResult> {
  const base = getBackendApiBase();
  const url = base ? `${base}/api/auth/google` : '/api/auth/google';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, desiredRole }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: text || `HTTP ${res.status}` };
  }
  const data = (await res.json()) as { ok?: boolean; user?: any };
  if (!data.ok || !data.user?.id) return { ok: false, error: 'auth_failed' };
  return { ok: true, user: data.user };
}

