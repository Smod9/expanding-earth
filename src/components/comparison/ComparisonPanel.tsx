'use client';

import { useStore } from '@/store/useStore';
import { SEED_SCENARIOS } from '@/engine/scenarios';
import { EMPIRICAL_CONSTRAINTS } from '@/engine/constraints';
import { computePlanetaryState } from '@/engine/physics';
import { Panel } from '../ui/Panel';
import { ConstraintBadge } from '../ui/ConstraintBadge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const SLOT_COLORS = ['#60a5fa', '#f59e0b', '#22c55e'];

export function ComparisonPanel() {
  const { comparisonSlots, setComparisonSlot, timeMya } = useStore();

  const slotStates = comparisonSlots.map((slot) =>
    computePlanetaryState(timeMya, slot.params),
  );

  const metrics = [
    { key: 'radiusKm', label: 'Radius', unit: 'km', extract: (i: number) => slotStates[i].radius / 1e3 },
    { key: 'gravity', label: 'Surface Gravity', unit: 'm/s²', extract: (i: number) => slotStates[i].surfaceGravity },
    { key: 'density', label: 'Mean Density', unit: 'kg/m³', extract: (i: number) => slotStates[i].meanDensity },
    { key: 'dayLength', label: 'Day Length', unit: 'hr', extract: (i: number) => slotStates[i].dayLength },
    { key: 'oblateness', label: 'Oblateness (1/f)', unit: '', extract: (i: number) => slotStates[i].oblateness > 0 ? 1 / slotStates[i].oblateness : 0 },
    { key: 'regime', label: 'Tectonic Regime', unit: '', extract: (i: number) => slotStates[i].tectonicRegime.replace(/_/g, ' ') },
  ];

  // Build comparison chart data
  const comparisonCharts = [
    { key: 'radiusKm', label: 'Radius (km)', tsKey: (s: typeof comparisonSlots[0]['timeSeries'][0]) => s.radius / 1e3 },
    { key: 'dayLength', label: 'Day Length (hr)', tsKey: (s: typeof comparisonSlots[0]['timeSeries'][0]) => s.dayLength },
    { key: 'surfaceGravity', label: 'Gravity (m/s²)', tsKey: (s: typeof comparisonSlots[0]['timeSeries'][0]) => s.surfaceGravity },
    { key: 'meanDensity', label: 'Density (kg/m³)', tsKey: (s: typeof comparisonSlots[0]['timeSeries'][0]) => s.meanDensity },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Model Comparison</h2>
        <p className="text-sm text-muted max-w-2xl mx-auto">
          Compare different scenarios side by side. Same observations, different interpretations.
        </p>
      </div>

      {/* Slot selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comparisonSlots.map((slot, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SLOT_COLORS[i] }} />
              <h3 className="text-sm font-semibold">{slot.label}</h3>
            </div>
            <select
              value={slot.params.name}
              onChange={(e) => {
                const found = SEED_SCENARIOS.find((s) => s.name === e.target.value);
                if (found) setComparisonSlot(i, { ...found });
              }}
              className="w-full bg-surface-alt border border-border rounded px-2 py-1.5 text-xs mb-2"
            >
              {SEED_SCENARIOS.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted line-clamp-2">{slot.params.description}</p>
          </div>
        ))}
      </div>

      {/* Metric comparison table */}
      <Panel title={`State at ${timeMya === 0 ? 'Present' : `${timeMya} Ma`}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted font-medium">Metric</th>
                {comparisonSlots.map((slot, i) => (
                  <th key={i} className="text-right py-2 px-3 font-medium" style={{ color: SLOT_COLORS[i] }}>
                    {slot.label}
                  </th>
                ))}
                <th className="text-right py-2 px-3 text-muted font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const vals = comparisonSlots.map((_, i) => m.extract(i));
                const isNumeric = typeof vals[0] === 'number';
                const delta = isNumeric && vals.length >= 2 ? Math.abs((vals[0] as number) - (vals[1] as number)) : null;
                return (
                  <tr key={m.key} className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted">
                      {m.label} {m.unit && <span className="text-[10px]">({m.unit})</span>}
                    </td>
                    {vals.map((v, i) => (
                      <td key={i} className="text-right py-2 px-3 font-mono">
                        {typeof v === 'number' ? v.toFixed(v > 100 ? 0 : 3) : v}
                      </td>
                    ))}
                    <td className="text-right py-2 px-3 font-mono text-muted">
                      {delta !== null ? (delta > 100 ? delta.toFixed(0) : delta.toFixed(3)) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Constraint comparison */}
      <Panel title="Constraint Assessment">
        <div className="space-y-2">
          {EMPIRICAL_CONSTRAINTS.map((constraint) => {
            const results = comparisonSlots.map((slot) =>
              constraint.evaluate(
                computePlanetaryState(timeMya, slot.params),
                slot.params,
              ),
            );
            return (
              <div key={constraint.id} className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-xs text-muted">{constraint.name}</span>
                <div className="flex gap-4">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SLOT_COLORS[i] }} />
                      <ConstraintBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Overlay charts */}
      <Panel title="Time Series Overlay">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {comparisonCharts.map((chart) => {
            const data = comparisonSlots[0].timeSeries.map((s, idx) => {
              const row: Record<string, number> = { timeMya: s.timeMya };
              comparisonSlots.forEach((slot, si) => {
                const ts = slot.timeSeries[idx];
                if (ts) row[`slot${si}`] = chart.tsKey(ts);
              });
              return row;
            });

            return (
              <div key={chart.key} className="bg-surface-alt rounded-lg p-3">
                <h4 className="text-xs font-medium mb-2">{chart.label}</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                    <XAxis
                      dataKey="timeMya"
                      reversed
                      tick={{ fontSize: 10, fill: 'var(--muted)' }}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}Ga` : `${v}Ma`}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    {comparisonSlots.map((slot, si) => (
                      <Line
                        key={si}
                        type="monotone"
                        dataKey={`slot${si}`}
                        name={slot.label}
                        stroke={SLOT_COLORS[si]}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Interpretation guidance */}
      <Panel title="Interpretation Guide">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted">
          <div className="p-3 bg-surface-alt rounded-lg">
            <h4 className="font-medium text-foreground mb-1">Shared Observations</h4>
            <p>Both models must explain the same present-day measurements: radius, gravity, day length, moment of inertia, geodetic rates. They diverge in how they explain past states.</p>
          </div>
          <div className="p-3 bg-surface-alt rounded-lg">
            <h4 className="font-medium text-foreground mb-1">Where Models Diverge</h4>
            <p>Alternative models predict different past densities, day lengths, and tectonic states. The constraint panel shows where these divergences create tension with observations.</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
