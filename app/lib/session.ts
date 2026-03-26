export const ROLE_STORAGE_KEY = 'plantsignal-role';

export type UserRole = 'ciftci' | 'muhendis';

export function getStoredRole(): UserRole {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    if (raw === 'muhendis') return 'muhendis';
    return 'ciftci';
  } catch {
    return 'ciftci';
  }
}

export function setStoredRole(role: UserRole) {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // ignore
  }
}

export function clearStoredRole() {
  try {
    localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
