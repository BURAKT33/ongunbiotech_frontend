export type GoogleAuthResult =
  | {
      ok: true;
      user: { id: string; email?: string; name?: string; picture?: string; role?: 'ciftci' | 'muhendis' };
    }
  | { ok: false; error: string };

export function getApiBaseOrThrow(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('VITE_API_BASE_URL_not_set');
  return base;
}

export async function postGoogleCredential(
  credential: string,
  desiredRole?: 'ciftci' | 'muhendis',
): Promise<GoogleAuthResult> {
  const base = getApiBaseOrThrow();
  const res = await fetch(`${base}/api/auth/google`, {
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

