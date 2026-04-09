'use client';

import { useStore } from '@/store/useStore';
import { EpistemicBadge } from '../ui/EpistemicBadge';
import { EARTH_RADIUS } from '@/engine/constants';
import type { EpistemicTag } from '@/engine/types';

interface ReadoutRow {
  label: string;
  value: string;
  unit: string;
  tag: EpistemicTag;
  tooltip?: string;
}

export function StateReadout() {
  const { currentState } = useStore();
  const s = currentState;

  const rows: ReadoutRow[] = [
    {
      label: 'Mean Radius',
      value: (s.radius / 1e6).toFixed(4),
      unit: '× 10⁶ m',
      tag: s.tags.radius || 'modeled',
      tooltip: `${(s.radius / 1e3).toFixed(1)} km — ${((s.radius / EARTH_RADIUS - 1) * 100).toFixed(2)}% from present`,
    },
    {
      label: 'Expansion Rate',
      value: (s.expansionRate * 1e3).toFixed(4),
      unit: 'mm/yr',
      tag: s.tags.expansionRate || 'modeled',
    },
    {
      label: 'Mean Density',
      value: s.meanDensity.toFixed(0),
      unit: 'kg/m³',
      tag: s.tags.meanDensity || 'modeled',
    },
    {
      label: 'Surface Gravity',
      value: s.surfaceGravity.toFixed(3),
      unit: 'm/s²',
      tag: s.tags.surfaceGravity || 'modeled',
    },
    {
      label: 'Day Length',
      value: s.dayLength.toFixed(2),
      unit: 'hours',
      tag: s.tags.dayLength || 'modeled',
    },
    {
      label: 'Oblateness',
      value: s.oblateness > 0 ? `1/${(1 / s.oblateness).toFixed(0)}` : '0',
      unit: '',
      tag: s.tags.oblateness || 'modeled',
      tooltip: `f = ${s.oblateness.toFixed(6)}`,
    },
    {
      label: 'Eq. Radius',
      value: (s.equatorialRadius / 1e3).toFixed(1),
      unit: 'km',
      tag: s.tags.oblateness || 'modeled',
    },
    {
      label: 'Polar Radius',
      value: (s.polarRadius / 1e3).toFixed(1),
      unit: 'km',
      tag: s.tags.oblateness || 'modeled',
    },
    {
      label: 'MoI Factor',
      value: s.moiFactor.toFixed(4),
      unit: 'I/(MR²)',
      tag: s.tags.momentOfInertia || 'modeled',
    },
    {
      label: 'Pole Drift Rate',
      value: s.poleDriftRate.toFixed(3),
      unit: '°/Myr',
      tag: s.tags.poleDrift || 'speculative',
    },
    {
      label: 'Tectonic Regime',
      value: formatRegime(s.tectonicRegime),
      unit: '',
      tag: s.tags.tectonicRegime || 'speculative',
    },
    {
      label: 'Relaxation',
      value: (s.relaxationFraction * 100).toFixed(1),
      unit: '%',
      tag: 'modeled',
      tooltip: 'How close the shape is to hydrostatic equilibrium',
    },
  ];

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Planetary State</h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2" title={row.tooltip}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted truncate">{row.label}</span>
              <EpistemicBadge tag={row.tag} />
            </div>
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-sm font-mono font-medium">{row.value}</span>
              {row.unit && <span className="text-[10px] text-muted">{row.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatRegime(regime: string): string {
  return regime.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
