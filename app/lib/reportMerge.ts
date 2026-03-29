import type { ReportItem } from './reportTypes';

/** Buluttaki dosya kayıtları + yalnızca yerelde kalan analyzer raporları. */
export function mergeCloudAndLocalApiReports(
  cloud: ReportItem[],
  localAll: ReportItem[],
): ReportItem[] {
  const localApi = localAll.filter((r) => r.source === 'api');
  const cloudKeys = new Set(
    cloud.map((c) => c.clientReportId).filter(Boolean) as string[],
  );
  const localOnly = localApi
    .filter((r) => !cloudKeys.has(r.clientReportId ?? r.id))
    .map((r) => ({ ...r, storageBackend: 'local' as const }));
  return [...cloud, ...localOnly];
}
