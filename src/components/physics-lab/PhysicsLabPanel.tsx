'use client';

import { useMemo, useState } from 'react';
import {
  DEFAULT_PHYSICS_LAB,
  computePhysicsLabSnapshot,
  sweepRadius,
  sweepDayLength,
  type PhysicsLabParams,
} from '@/engine/pure-physics';
import { EARTH_RADIUS } from '@/engine/constants';
import { Panel } from '@/components/ui/Panel';
import { LabCrossSection } from './LabCrossSection';
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

function Readout({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-alt px-3 py-2 min-w-[120px]">
      <div className="text-[10px] text-muted uppercase tracking-wide">{label}</div>
      <div className="text-sm font-mono text-foreground">
        {value}
        {unit && <span className="text-muted text-xs ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function LabChart({
  title,
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  currentX,
  refY,
  refLabel,
  refY2,
  refLabel2,
  color,
}: {
  title: string;
  data: Record<string, number>[];
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
  currentX: number;
  refY?: number;
  refLabel?: string;
  /** Secondary horizontal line (e.g. ω = ω_max at y=1) */
  refY2?: number;
  refLabel2?: string;
  color: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <h4 className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">{title}</h4>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 9, fill: 'var(--muted)' }}
              label={{ value: xLabel, position: 'bottom', offset: -2, fontSize: 9, fill: 'var(--muted)' }}
            />
            <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 9, fill: 'var(--muted)' }} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11 }}
              formatter={(v: unknown) => [Number(v).toExponential(3), yLabel]}
              labelFormatter={(l: unknown) => `${xLabel}: ${Number(l).toFixed(3)}`}
            />
            {refY !== undefined && refY !== null && (
              <ReferenceLine y={refY} stroke="#ef4444" strokeDasharray="4 4" label={refLabel} />
            )}
            {refY2 !== undefined && refY2 !== null && (
              <ReferenceLine y={refY2} stroke="#f97316" strokeDasharray="3 3" label={refLabel2} />
            )}
            <ReferenceLine x={currentX} stroke="var(--accent)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PhysicsLabPanel() {
  const [params, setParams] = useState<PhysicsLabParams>(DEFAULT_PHYSICS_LAB);

  const snapshot = useMemo(() => computePhysicsLabSnapshot(params), [params]);

  const rMin = EARTH_RADIUS * 0.5;
  const rMax = EARTH_RADIUS * 3;
  const dataRadius = useMemo(
    () => sweepRadius(params, rMin, rMax, 80),
    [params],
  );

  const hMin = 2;
  const hMax = Number.isFinite(snapshot.breakupDayLengthHours)
    ? Math.min(200, snapshot.breakupDayLengthHours * 0.995)
    : 200;
  const dataDay = useMemo(
    () => sweepDayLength(params, hMin, hMax, 80),
    [params, hMax],
  );

  const currentRKm = params.meanRadiusM / 1000;
  const currentH = params.dayLengthHours;

  const set = <K extends keyof PhysicsLabParams>(key: K, value: PhysicsLabParams[K]) => {
    setParams((p) => ({ ...p, [key]: value }));
  };

  const resetEarth = () => setParams(DEFAULT_PHYSICS_LAB);

  const fInv = snapshot.flattening > 0 ? (1 / snapshot.flattening).toFixed(0) : '∞';

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="max-w-3xl">
        <h2 className="text-lg font-bold">Physics Lab</h2>
        <p className="text-sm text-muted mt-1">
          First-principles rotating layered body: hydrostatic figure, breakup spin, crust hoop stress, Euler
          wobble time, and energy ratios. Not a geologic narrative — pure mechanics on a 1D layered model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-3 lg:sticky lg:top-28 lg:self-start">
          <Panel title="Body" collapsible defaultOpen>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="text-muted">Mass (Earth masses)</span>
                <input
                  type="range"
                  min={0.1}
                  max={10}
                  step={0.05}
                  value={params.totalMassEarth}
                  onChange={(e) => set('totalMassEarth', Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-mono">{params.totalMassEarth.toFixed(2)} M⊕</span>
              </label>
              <label className="block">
                <span className="text-muted">Mean radius (km)</span>
                <input
                  type="range"
                  min={3000}
                  max={20000}
                  step={50}
                  value={params.meanRadiusM / 1000}
                  onChange={(e) => set('meanRadiusM', Number(e.target.value) * 1000)}
                  className="w-full"
                />
                <span className="font-mono">{(params.meanRadiusM / 1000).toFixed(0)} km</span>
              </label>
              <label className="block">
                <span className="text-muted">Core radius fraction</span>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.01}
                  value={params.coreRadiusFraction}
                  onChange={(e) => set('coreRadiusFraction', Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-mono">{params.coreRadiusFraction.toFixed(2)}</span>
              </label>
              <label className="block">
                <span className="text-muted">Core density (kg/m³)</span>
                <input
                  type="range"
                  min={5000}
                  max={15000}
                  step={100}
                  value={params.coreDensity}
                  onChange={(e) => set('coreDensity', Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-mono">{params.coreDensity}</span>
              </label>
              <label className="block">
                <span className="text-muted">Mantle density (kg/m³)</span>
                <input
                  type="range"
                  min={3000}
                  max={6000}
                  step={50}
                  value={params.mantleDensity}
                  onChange={(e) => set('mantleDensity', Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-mono">{params.mantleDensity}</span>
              </label>
              <label className="block">
                <span className="text-muted">Day length (h)</span>
                <input
                  type="range"
                  min={2}
                  max={200}
                  step={0.5}
                  value={params.dayLengthHours}
                  onChange={(e) => set('dayLengthHours', Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-mono">{params.dayLengthHours.toFixed(1)} h</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.conserveAngularMomentum}
                  onChange={(e) => set('conserveAngularMomentum', e.target.checked)}
                />
                <span className="text-muted">Conserve angular momentum in radius sweeps</span>
              </label>
            </div>
          </Panel>

          <Panel title="Crust shell" collapsible defaultOpen>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="text-muted">Thickness (km)</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={params.crustThicknessM / 1000}
                  onChange={(e) => set('crustThicknessM', Number(e.target.value) * 1000)}
                  className="w-full"
                />
                <span className="font-mono">{(params.crustThicknessM / 1000).toFixed(0)} km</span>
              </label>
              <label className="block">
                <span className="text-muted">Yield strength (MPa)</span>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={10}
                  value={params.crustYieldMpa}
                  onChange={(e) => set('crustYieldMpa', Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-mono">{params.crustYieldMpa} MPa</span>
              </label>
            </div>
          </Panel>

          <Panel title="Wobble / anomaly" collapsible defaultOpen>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="text-muted">Mass anomaly (% of M)</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.05}
                  value={params.massAnomalyFraction * 100}
                  onChange={(e) => set('massAnomalyFraction', Number(e.target.value) / 100)}
                  className="w-full"
                />
                <span className="font-mono">{(params.massAnomalyFraction * 100).toFixed(2)} %</span>
              </label>
              <label className="block">
                <span className="text-muted">Anomaly colatitude (°)</span>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={1}
                  value={params.anomalyColatitudeDeg}
                  onChange={(e) => set('anomalyColatitudeDeg', Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-mono">{params.anomalyColatitudeDeg}°</span>
              </label>
            </div>
          </Panel>

          <button
            type="button"
            onClick={resetEarth}
            className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-xs font-medium hover:bg-surface transition-colors"
          >
            Reset to Earth-like
          </button>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap gap-2">
            <Readout label="g" value={snapshot.surfaceGravity.toFixed(3)} unit="m/s²" />
            <Readout label="Hydrostatic f" value={`1/${fInv}`} />
            <Readout
              label="ω / ω_breakup"
              value={(snapshot.stabilityMargin * 100).toFixed(1)}
              unit="%"
            />
            <Readout
              label="Breakup T_day"
              value={Number.isFinite(snapshot.breakupDayLengthHours) ? snapshot.breakupDayLengthHours.toFixed(1) : '—'}
              unit="h"
            />
            <Readout
              label="Crust σ / yield"
              value={snapshot.crustIntegrityRatio.toFixed(2)}
            />
            <Readout
              label="Euler period"
              value={Number.isFinite(snapshot.eulerPeriodDays) && snapshot.eulerPeriodDays < 1e20 ? snapshot.eulerPeriodDays.toFixed(2) : '∞'}
              unit="d"
            />
            <Readout
              label="TPW thresh. δm/M"
              value={(snapshot.tpwThresholdMassFraction * 100).toFixed(3)}
              unit="%"
            />
            <Readout label="E_rot / |E_grav|" value={snapshot.eRatio.toExponential(2)} />
            <Readout
              label="E_crust (elastic)"
              value={snapshot.crustElasticEnergyJ.toExponential(2)}
              unit="J"
            />
            <Readout
              label="R_crit (crust yield)"
              value={
                snapshot.criticalRadiusCrustFailKm != null
                  ? snapshot.criticalRadiusCrustFailKm.toFixed(0)
                  : '—'
              }
              unit="km"
            />
          </div>

          <LabCrossSection params={params} snapshot={snapshot} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <LabChart
              title="Flattening vs radius"
              data={dataRadius.map((d) => ({ ...d, radiusKm: d.x }))}
              xKey="radiusKm"
              yKey="flattening"
              xLabel="R (km)"
              yLabel="f"
              currentX={currentRKm}
              color="#60a5fa"
            />
            <LabChart
              title="Flattening vs day length"
              data={dataDay.map((d) => ({ ...d, h: d.x }))}
              xKey="h"
              yKey="flattening"
              xLabel="T_day (h)"
              yLabel="f"
              currentX={currentH}
              color="#a78bfa"
            />
            <LabChart
              title="Day length vs radius (sweep)"
              data={dataRadius.map((d) => ({ ...d, radiusKm: d.x, dl: d.dayLengthHours }))}
              xKey="radiusKm"
              yKey="dl"
              xLabel="R (km)"
              yLabel="T_day (h)"
              currentX={currentRKm}
              color="#22c55e"
            />
            <LabChart
              title="Stability margin vs radius"
              data={dataRadius.map((d) => ({ ...d, radiusKm: d.x, sm: d.stabilityMargin }))}
              xKey="radiusKm"
              yKey="sm"
              xLabel="R (km)"
              yLabel="ω/ω_max"
              currentX={currentRKm}
              refY2={1}
              refLabel2="breakup"
              color="#f59e0b"
            />
            <LabChart
              title="Crust hoop stress vs radius"
              data={dataRadius.map((d) => ({ ...d, radiusKm: d.x, stress: d.crustStressMpa }))}
              xKey="radiusKm"
              yKey="stress"
              xLabel="R (km)"
              yLabel="σ (MPa)"
              currentX={currentRKm}
              refY={params.crustYieldMpa}
              refLabel="yield"
              color="#ef4444"
            />
            <LabChart
              title="Energy ratio vs radius"
              data={dataRadius.map((d) => ({ ...d, radiusKm: d.x, er: d.energyRatio }))}
              xKey="radiusKm"
              yKey="er"
              xLabel="R (km)"
              yLabel="E_rot/|E_grav|"
              currentX={currentRKm}
              color="#06b6d4"
            />
          </div>

          <p className="text-[10px] text-muted leading-relaxed max-w-4xl">
            Breakup spin uses ω_max = √(GM/R³).             Crust hoop stress uses a thin-shell approximation with
            ΔP ∝ ρ_m ω²R²f; elastic energy ~ σ²/(2E)×shell volume. Euler period uses A,C split from mean I and
            small-oblateness scaling. TPW threshold is order-of-magnitude δm/M ∼ |C−A|/(MR²). R_crit is the
            first radius in the sweep where σ ≥ σ_yield. All are toy models for intuition.
          </p>
        </div>
      </div>
    </div>
  );
}
