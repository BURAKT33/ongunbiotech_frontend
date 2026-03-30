export const ROLE_STORAGE_KEY = 'plantsignal-role';
export const USER_PROFILE_STORAGE_KEY = 'plantsignal-user-profile';

export type UserRole = 'ciftci' | 'muhendis';

export type StoredUserProfile = {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
  /** Kalıcı paylaşım kodu (örn. ONG-XXXXXXXX); Firestore `users` ve `userPublicIds` ile uyumlu. */
  publicId?: string;
};

export function getStoredUserProfile(): StoredUserProfile | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredUserProfile;
    if (!p?.uid || (p.role !== 'muhendis' && p.role !== 'ciftci')) return null;
    return p;
  } catch {
    return null;
  }
}

export function setStoredUserProfile(profile: StoredUserProfile) {
  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function clearStoredUserProfile() {
  try {
    localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

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

export function clearSessionStorage() {
  clearStoredRole();
  clearStoredUserProfile();
}
