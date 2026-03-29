import type { PlantAnalyzerResponse, SignalChartPayload } from './analyzerTypes';

function isSignalChartPayload(x: unknown): x is SignalChartPayload {
  return Boolean(
    x &&
      typeof x === 'object' &&
      Array.isArray((x as SignalChartPayload).values) &&
      (x as SignalChartPayload).values!.length > 0,
  );
}

/**
 * Analyzer bazen `report` / `signal_chart` alanlarını kökte, bazen `analysis` içinde döndürür.
 * Frontend her iki şekli de tek şemaya indirger.
 */
export function normalizePlantAnalyzerResponse(raw: PlantAnalyzerResponse): PlantAnalyzerResponse {
  const a = raw.analysis;
  const nested =
    a && typeof a === 'object' && !Array.isArray(a)
      ? (a as Record<string, unknown>)
      : null;

  const reportFromRoot = typeof raw.report === 'string' && raw.report.trim() ? raw.report : undefined;
  const reportFromNested =
    nested && typeof nested.report === 'string' && nested.report.trim()
      ? nested.report
      : undefined;
  const report = reportFromRoot ?? reportFromNested ?? raw.report;

  const chartFromRoot = raw.signal_chart;
  const chartNested = nested?.signal_chart;
  const signal_chart = isSignalChartPayload(chartFromRoot)
    ? chartFromRoot
    : isSignalChartPayload(chartNested)
      ? (chartNested as SignalChartPayload)
      : raw.signal_chart;

  return { ...raw, report, signal_chart };
}
