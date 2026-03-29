/** Plant analyzer Cloud Run JSON yanıtı (kısmi; ek alanlar olabilir) */

export type SignalChartPayload = {
  bin_size?: number;
  column?: string;
  values: number[];
  source_sample_count?: number;
  bin_count?: number;
};

export type PlantAnalyzerResponse = {
  ok?: boolean;
  durum?: string;
  report?: string;
  signal_chart?: SignalChartPayload;
  analysis?: {
    durum?: string;
    /** Bazı pipeline sürümleri raporu analysis altında döndürebilir */
    report?: string;
    signal_chart?: SignalChartPayload;
    metadata?: {
      signal_type?: string;
      sampling_rate_hz?: number;
      analysis_date?: string;
      source_file?: string;
      n_samples?: number;
    };
    neurokit2_analysis?: {
      stress_score?: number;
    };
  };
  [key: string]: unknown;
};
