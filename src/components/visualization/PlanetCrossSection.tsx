'use client';

import { useStore } from '@/store/useStore';
import { EARTH_RADIUS } from '@/engine/constants';

export function PlanetCrossSection() {
  const { currentState, activeParams } = useStore();
  const s = currentState;

  const viewSize = 300;
  const cx = viewSize / 2;
  const cy = viewSize / 2;

  // Scale relative to Earth's current radius
  const scale = 120;
  const radiusRatio = s.radius / EARTH_RADIUS;
  const baseR = scale * radiusRatio;

  // Oblateness: equatorial (horizontal) is wider, polar (vertical) is shorter
  const f = s.oblateness;
  const rx = baseR * (1 + f / 3);
  const ry = baseR * (1 - 2 * f / 3);

  // Core
  const coreRx = rx * activeParams.coreRadiusFraction;
  const coreRy = ry * activeParams.coreRadiusFraction;

  // Rotation axis (may tilt slightly for pole drift visualization)
  const tiltDeg = Math.min(s.cumulativePoleDrift, 20);

  // Regime color
  const regimeColors: Record<string, string> = {
    stagnant_lid: '#8b5a2b',
    episodic_overturn: '#d97706',
    mobile_lid: '#22c55e',
    heat_pipe: '#ef4444',
    transitional: '#a78bfa',
  };
  const crustColor = regimeColors[s.tectonicRegime] || '#22c55e';

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Cross-Section</h3>

      <svg viewBox={`0 0 ${viewSize} ${viewSize}`} className="w-full max-w-[300px] mx-auto">
        {/* Background grid */}
        <defs>
          <radialGradient id="coreGrad" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <radialGradient id="mantleGrad" cx="45%" cy="45%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="60%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
        </defs>

        <g transform={`rotate(${tiltDeg}, ${cx}, ${cy})`}>
          {/* Mantle */}
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#mantleGrad)" opacity={0.9} />

          {/* Crust (thin ring) */}
          <ellipse
            cx={cx} cy={cy} rx={rx} ry={ry}
            fill="none"
            stroke={crustColor}
            strokeWidth={3}
            opacity={0.8}
          />

          {/* Core */}
          <ellipse cx={cx} cy={cy} rx={coreRx} ry={coreRy} fill="url(#coreGrad)" opacity={0.9} />

          {/* Rotation axis */}
          <line
            x1={cx} y1={cy - ry - 20}
            x2={cx} y2={cy + ry + 20}
            stroke="var(--accent)"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.6}
          />

          {/* Axis labels */}
          <text x={cx + 4} y={cy - ry - 22} fill="var(--accent)" fontSize={8} opacity={0.7}>N</text>
          <text x={cx + 4} y={cy + ry + 28} fill="var(--accent)" fontSize={8} opacity={0.7}>S</text>

          {/* Equatorial line */}
          <line
            x1={cx - rx - 15} y1={cy}
            x2={cx + rx + 15} y2={cy}
            stroke="var(--muted)"
            strokeWidth={0.5}
            strokeDasharray="2 2"
            opacity={0.4}
          />
        </g>

        {/* Labels */}
        <text x={10} y={viewSize - 10} fill="var(--muted)" fontSize={9} fontFamily="monospace">
          R = {(s.radius / 1e3).toFixed(0)} km
        </text>
        <text x={10} y={viewSize - 22} fill="var(--muted)" fontSize={9} fontFamily="monospace">
          f = {s.oblateness > 0 ? `1/${(1 / s.oblateness).toFixed(0)}` : '0'}
        </text>
        <text x={viewSize - 10} y={viewSize - 10} fill={crustColor} fontSize={8} textAnchor="end">
          {s.tectonicRegime.replace(/_/g, ' ')}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          Core
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-700" />
          Mantle
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: crustColor }} />
          Crust
        </div>
      </div>
    </div>
  );
}
