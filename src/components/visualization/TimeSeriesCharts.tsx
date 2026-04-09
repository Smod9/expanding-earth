'use client';

import { useStore } from '@/store/useStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { EpistemicBadge } from '../ui/EpistemicBadge';
import type { EpistemicTag } from '@/engine/types';

interface ChartDef {
  title: string;
  dataKey: string;
  unit: string;
  tag: EpistemicTag;
  color: string;
  formatter: (v: number) => string;
  refLine?: { y: number; label: string };
}

const CHARTS: ChartDef[] = [
  {
    title: 'Radius',
    dataKey: 'radiusKm',
    unit: 'km',
    tag: 'modeled',
    color: '#60a5fa',
    formatter: (v) => `${v.toFixed(0)} km`,
  },
  {
    title: 'Expansion Rate',
    dataKey: 'expansionRateMm',
    unit: 'mm/yr',
    tag: 'speculative',
    color: '#a78bfa',
    formatter: (v) => `${v.toFixed(3)} mm/yr`,
    refLine: { y: 0.2, label: 'Geodetic limit' },
  },
  {
    title: 'Surface Gravity',
    dataKey: 'surfaceGravity',
    unit: 'm/s²',
    tag: 'modeled',
    color: '#f59e0b',
    formatter: (v) => `${v.toFixed(3)} m/s²`,
  },
  {
    title: 'Mean Density',
    dataKey: 'meanDensity',
    unit: 'kg/m³',
    tag: 'modeled',
    color: '#ef4444',
    formatter: (v) => `${v.toFixed(0)} kg/m³`,
  },
  {
    title: 'Day Length',
    dataKey: 'dayLength',
    unit: 'hours',
    tag: 'modeled',
    color: '#22c55e',
    formatter: (v) => `${v.toFixed(2)} hr`,
  },
  {
    title: 'Oblateness (1/f)',
    dataKey: 'invFlattening',
    unit: '',
    tag: 'modeled',
    color: '#06b6d4',
    formatter: (v) => `1/${v.toFixed(0)}`,
  },
  {
    title: 'MoI Factor',
    dataKey: 'moiFactor',
    unit: 'I/(MR²)',
    tag: 'modeled',
    color: '#ec4899',
    formatter: (v) => v.toFixed(4),
  },
  {
    title: 'Pole Drift Rate',
    dataKey: 'poleDriftRate',
    unit: '°/Myr',
    tag: 'speculative',
    color: '#8b5cf6',
    formatter: (v) => `${v.toFixed(3)} °/Myr`,
  },
];

export function TimeSeriesCharts() {
  const { timeSeries, timeMya } = useStore();

  const chartData = timeSeries.map((s) => ({
    timeMya: s.timeMya,
    radiusKm: s.radius / 1e3,
    expansionRateMm: s.expansionRate * 1e3,
    surfaceGravity: s.surfaceGravity,
    meanDensity: s.meanDensity,
    dayLength: s.dayLength,
    invFlattening: s.oblateness > 0 ? 1 / s.oblateness : 0,
    moiFactor: s.moiFactor,
    poleDriftRate: s.poleDriftRate,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {CHARTS.map((chart) => (
        <div key={chart.dataKey} className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold">{chart.title}</h4>
              <EpistemicBadge tag={chart.tag} />
            </div>
            {chart.unit && <span className="text-[10px] text-muted">{chart.unit}</span>}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.4} />
              <XAxis
                dataKey="timeMya"
                reversed
                tick={{ fontSize: 10, fill: 'var(--muted)' }}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}Ga` : `${v}Ma`}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted)' }}
                tickFormatter={(v: number) => {
                  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
                  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
                  return v.toFixed(v < 1 ? 3 : 1);
                }}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
                formatter={(value: unknown) => [chart.formatter(Number(value)), chart.title]}
                labelFormatter={(label: unknown) => {
                  const v = Number(label);
                  return v === 0 ? 'Present' : v >= 1000 ? `${(v / 1000).toFixed(2)} Ga` : `${v} Ma`;
                }}
              />
              {chart.refLine && (
                <ReferenceLine
                  y={chart.refLine.y}
                  stroke="var(--incompatible)"
                  strokeDasharray="5 3"
                  strokeWidth={1}
                  label={{
                    value: chart.refLine.label,
                    position: 'right',
                    fill: 'var(--incompatible)',
                    fontSize: 9,
                  }}
                />
              )}
              <ReferenceLine
                x={timeMya}
                stroke="var(--accent)"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey={chart.dataKey}
                stroke={chart.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: chart.color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
