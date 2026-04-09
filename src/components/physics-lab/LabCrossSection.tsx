'use client';

import { useId } from 'react';
import type { PhysicsLabParams, PhysicsLabSnapshot } from '@/engine/pure-physics';
import { EARTH_RADIUS } from '@/engine/constants';

type Props = {
  params: PhysicsLabParams;
  snapshot: PhysicsLabSnapshot;
  /** Exaggerate visual flattening for display (true f is labeled) */
  visualFlatteningScale?: number;
};

export function LabCrossSection({
  params,
  snapshot,
  visualFlatteningScale = 8,
}: Props) {
  const maskId = useId().replace(/:/g, '');
  const viewSize = 400;
  const cx = viewSize / 2;
  const cy = viewSize / 2;

  const scale = 150;
  const radiusRatio = snapshot.radius / EARTH_RADIUS;
  const baseR = scale * radiusRatio;

  const f = snapshot.flattening * visualFlatteningScale;
  const rx = baseR * (1 + f / 3);
  const ry = baseR * (1 - (2 * f) / 3);

  const coreFrac = params.coreRadiusFraction;
  const coreRx = rx * coreFrac;
  const coreRy = ry * coreFrac;

  const tCrust = params.crustThicknessM;
  const fracCrust = tCrust > 0 ? Math.min(tCrust / snapshot.radius, 0.08) : 0;
  const innerRx = rx * (1 - fracCrust);
  const innerRy = ry * (1 - fracCrust);

  const integrity = snapshot.crustIntegrityRatio;
  let crustFill = 'rgba(34, 197, 94, 0.35)';
  if (integrity > 0.85) crustFill = 'rgba(234, 179, 8, 0.4)';
  if (integrity > 1) crustFill = 'rgba(239, 68, 68, 0.45)';

  const wobblePsi = Math.min(Math.max(snapshot.wobbleConeDeg, 0), 45);
  const axisTiltDeg = Math.min(Math.max(snapshot.wobbleConeDeg, 0), 35);
  const lineLen = ry + 36;

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">2D cross-section</h3>
        <span className="text-[10px] text-muted">
          Figure exaggerated ×{visualFlatteningScale} for display; labeled f is model value
        </span>
      </div>

      <svg viewBox={`0 0 ${viewSize} ${viewSize}`} className="w-full max-w-[400px] mx-auto">
        <defs>
          <radialGradient id={`labCoreGrad-${maskId}`} cx="40%" cy="40%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <radialGradient id={`labMantleGrad-${maskId}`} cx="45%" cy="45%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="60%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
          <mask id={`crustRing-${maskId}`} maskUnits="userSpaceOnUse">
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="white" />
            <ellipse cx={cx} cy={cy} rx={innerRx} ry={innerRy} fill="black" />
          </mask>
        </defs>

        {/* Wobble cone envelope (inertial frame): ±ψ from figure axis */}
        {wobblePsi > 0.02 && (
          <>
            <line
              x1={cx}
              y1={cy - lineLen}
              x2={cx}
              y2={cy + lineLen}
              stroke="var(--muted)"
              strokeWidth={0.75}
              strokeDasharray="4 4"
              opacity={0.4}
              transform={`rotate(${axisTiltDeg - wobblePsi}, ${cx}, ${cy})`}
            />
            <line
              x1={cx}
              y1={cy - lineLen}
              x2={cx}
              y2={cy + lineLen}
              stroke="var(--muted)"
              strokeWidth={0.75}
              strokeDasharray="4 4"
              opacity={0.4}
              transform={`rotate(${axisTiltDeg + wobblePsi}, ${cx}, ${cy})`}
            />
          </>
        )}

        <g transform={`rotate(${axisTiltDeg}, ${cx}, ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#labMantleGrad-${maskId})`} opacity={0.92} />

          <ellipse cx={cx} cy={cy} rx={coreRx} ry={coreRy} fill={`url(#labCoreGrad-${maskId})`} opacity={0.95} />

          {fracCrust > 0 && (
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={crustFill}
              mask={`url(#crustRing-${maskId})`}
            />
          )}

          <line
            x1={cx}
            y1={cy - ry - 28}
            x2={cx}
            y2={cy + ry + 28}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.75}
          />

          <text x={cx + 6} y={cy - ry - 30} fill="var(--accent)" fontSize={9} opacity={0.85}>
            N
          </text>
          <text x={cx + 6} y={cy + ry + 36} fill="var(--accent)" fontSize={9} opacity={0.85}>
            S
          </text>

          <line
            x1={cx - rx - 18}
            y1={cy}
            x2={cx + rx + 18}
            y2={cy}
            stroke="var(--muted)"
            strokeWidth={0.5}
            strokeDasharray="2 2"
            opacity={0.35}
          />
        </g>

        <text x={12} y={viewSize - 12} fill="var(--muted)" fontSize={9} fontFamily="monospace">
          R = {(snapshot.radius / 1e3).toFixed(0)} km
        </text>
        <text x={12} y={viewSize - 26} fill="var(--muted)" fontSize={9} fontFamily="monospace">
          f = {snapshot.flattening > 0 ? `1/${(1 / snapshot.flattening).toFixed(0)}` : '0'}
        </text>
        <text x={viewSize - 12} y={viewSize - 12} fill="var(--muted)" fontSize={8} textAnchor="end">
          ψ = {snapshot.wobbleConeDeg.toFixed(2)}°
        </text>
        <text x={viewSize - 12} y={viewSize - 24} fill={integrity > 1 ? '#ef4444' : 'var(--muted)'} fontSize={8} textAnchor="end">
          crust σ / σ_yield = {integrity.toFixed(2)}
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-4 mt-2 text-[10px] text-muted">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          Core
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-700" />
          Mantle
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full opacity-80" style={{ backgroundColor: crustFill }} />
          Crust shell
        </div>
        <div className="flex items-center gap-1">
          <span className="w-8 h-0.5 bg-[var(--accent)] opacity-70" style={{ borderStyle: 'dashed' }} />
          Spin axis
        </div>
        <div className="flex items-center gap-1">
          <span className="w-8 h-0.5 bg-muted opacity-50" style={{ borderStyle: 'dashed' }} />
          Wobble cone
        </div>
      </div>
    </div>
  );
}
