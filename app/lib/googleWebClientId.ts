/**
 * Google OAuth Web client ID. Tarayıcıda zaten görünür; gizli değildir.
 * İsterseniz VITE_GOOGLE_CLIENT_ID ile override edin (Vercel / .env.local).
 */
const DEFAULT_WEB_CLIENT_ID =
  '635662286956-a07p84e6ktsojseo0nj4hrcu4qp5rou9.apps.googleusercontent.com';

export function getGoogleWebClientId(): string {
  const fromEnv = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
  return fromEnv || DEFAULT_WEB_CLIENT_ID;
}
