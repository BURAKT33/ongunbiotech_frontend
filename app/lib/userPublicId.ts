/** Karışmayan karakterler (0/O/1/I yok). */
const BODY_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const USER_PUBLIC_ID_PREFIX = 'ONG';

/** Görünen / saklanan tam kod: ONG-XXXXXXXX */
export function formatPublicId(body: string): string {
  const clean = body.replace(/\s/g, '').toUpperCase();
  return `${USER_PUBLIC_ID_PREFIX}-${clean}`;
}

function randomBody(length: number): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let s = '';
  for (let i = 0; i < length; i++) {
    s += BODY_ALPHABET[arr[i]! % BODY_ALPHABET.length];
  }
  return s;
}

/** Kod üretir (otomatik atama). */
export function generatePublicIdCandidate(bodyLength = 8): string {
  return formatPublicId(randomBody(bodyLength));
}

/**
 * Kullanıcı girişi: ONG-XXX, ong xxx, yalnızca gövde vb. kabul eder.
 * Geçersizse null.
 */
export function normalizePublicIdInput(raw: string): string | null {
  let s = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!s) return null;
  if (s.startsWith(`${USER_PUBLIC_ID_PREFIX}-`)) {
    s = s.slice(USER_PUBLIC_ID_PREFIX.length + 1);
  } else if (s.startsWith(USER_PUBLIC_ID_PREFIX)) {
    s = s.slice(USER_PUBLIC_ID_PREFIX.length);
  }
  const clean = s.replace(new RegExp(`[^${BODY_ALPHABET}]`, 'gi'), '');
  if (clean.length < 6 || clean.length > 12) return null;
  return formatPublicId(clean);
}
