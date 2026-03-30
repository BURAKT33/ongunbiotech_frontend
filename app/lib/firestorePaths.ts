export const COL = {
  users: 'users',
  reports: 'reports',
  engagements: 'engagements',
  /** Belge id = tam paylaşım kodu (örn. ONG-XXXXXXXX). */
  userPublicIds: 'userPublicIds',
} as const;

export function engagementDocId(engineerUid: string, farmerUid: string): string {
  return `${engineerUid}_${farmerUid}`;
}
