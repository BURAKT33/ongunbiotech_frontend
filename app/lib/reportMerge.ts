import type { ReportItem } from './reportTypes';

export type MergeCloudLocalOpts = {
  /** Yerel listeden yalnızca bu sahibe ait API raporlarını al (çapraz kullanıcı sızıntısını önler). */
  viewerUid?: string | null;
};

/** Buluttaki dosya kayıtları + yalnızca yerelde kalan analyzer raporları. */
export function mergeCloudAndLocalApiReports(
  cloud: ReportItem[],
  localAll: ReportItem[],
  opts?: MergeCloudLocalOpts,
): ReportItem[] {
  const viewer = opts?.viewerUid;
  const localApi = localAll.filter((r) => {
    if (r.source !== 'api') return false;
    if (viewer && r.ownerUid && r.ownerUid !== viewer) return false;
    return true;
  });
  const cloudKeys = new Set(
    cloud.map((c) => c.clientReportId).filter(Boolean) as string[],
  );
  const localOnly = localApi
    .filter((r) => !cloudKeys.has(r.clientReportId ?? r.id))
    .map((r) => ({ ...r, storageBackend: 'local' as const }));
  return [...cloud, ...localOnly];
}
