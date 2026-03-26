import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SignalChartPayload } from '../../lib/analyzerTypes';

type Props = {
  chart: SignalChartPayload;
  title?: string;
};

export function ReportSignalCharts({ chart, title = 'Sinyal özeti (bin ortalaması)' }: Props) {
  const values = chart.values ?? [];
  if (values.length === 0) return null;

  const data = values.map((v, i) => ({
    bin: i + 1,
    value: v,
  }));

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      <p className="text-xs text-gray-500">
        {chart.column != null && (
          <>
            Sütun: <span className="font-medium text-gray-700">{chart.column}</span>
            {' · '}
          </>
        )}
        {chart.bin_size != null && (
          <>
            Bin boyutu: {chart.bin_size} örnek
            {' · '}
          </>
        )}
        {chart.source_sample_count != null && (
          <>Kaynak örnek: {chart.source_sample_count.toLocaleString('tr-TR')}</>
        )}
      </p>
      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="bin" tick={{ fontSize: 11 }} label={{ value: 'Bin', position: 'insideBottom', offset: -2 }} />
            <YAxis tick={{ fontSize: 11 }} width={56} tickFormatter={(v) => Number(v).toExponential(1)} />
            <Tooltip
              formatter={(v: number) => [v.toExponential(4), 'Değer']}
              labelFormatter={(l) => `Bin ${l}`}
            />
            <Legend />
            <Bar dataKey="value" name="Sütun (bin)" fill="#10b981" fillOpacity={0.45} radius={[2, 2, 0, 0]} />
            <Line
              type="monotone"
              dataKey="value"
              name="Çizgi"
              stroke="#047857"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
