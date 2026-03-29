export const ROLE_STORAGE_KEY = 'plantsignal-role';
export const USER_PROFILE_STORAGE_KEY = 'plantsignal-user-profile';
/** UIDs that registered (or first Google sign-in) after demo kapatma — Bitki İzleme örnek seraları gösterilmez. */
const NO_PLANT_DEMO_UIDS_KEY = 'plantsignal-no-plant-demo-uids';

function readNoPlantDemoUidSet(): Set<string> {
  try {
    const raw = localStorage.getItem(NO_PLANT_DEMO_UIDS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(list)) return new Set();
    return new Set(list.filter((x): x is string => typeof x === 'string' && x.length > 0));
  } catch {
    return new Set();
  }
}

export function markAccountWithoutPlantDemo(uid: string) {
  if (!uid) return;
  try {
    const set = readNoPlantDemoUidSet();
    if (set.has(uid)) return;
    set.add(uid);
    localStorage.setItem(NO_PLANT_DEMO_UIDS_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function shouldHidePlantDemo(uid: string | null | undefined): boolean {
  if (!uid) return false;
  return readNoPlantDemoUidSet().has(uid);
}

export type UserRole = 'ciftci' | 'muhendis';

export type StoredUserProfile = {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
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
