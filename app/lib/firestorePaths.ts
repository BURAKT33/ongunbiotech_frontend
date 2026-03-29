export const COL = {
  users: 'users',
  reports: 'reports',
  engagements: 'engagements',
} as const;

export function engagementDocId(engineerUid: string, farmerUid: string): string {
  return `${engineerUid}_${farmerUid}`;
}
