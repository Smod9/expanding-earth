'use client';

import { useStore } from '@/store/useStore';
import type { TectonicRegime } from '@/engine/types';

const REGIME_CONFIG: Record<TectonicRegime, { label: string; color: string }> = {
  heat_pipe: { label: 'Heat Pipe', color: '#ef4444' },
  stagnant_lid: { label: 'Stagnant Lid', color: '#8b5a2b' },
  episodic_overturn: { label: 'Episodic Overturn', color: '#d97706' },
  mobile_lid: { label: 'Mobile Lid (Plate Tectonics)', color: '#22c55e' },
  transitional: { label: 'Transitional', color: '#a78bfa' },
};

export function RegimeTimeline() {
  const { timeSeries, timeMya } = useStore();

  // Build regime segments
  const segments: Array<{ startMya: number; endMya: number; regime: TectonicRegime }> = [];
  let currentRegime: TectonicRegime | null = null;
  let segStart = 0;

  for (const state of timeSeries) {
    if (state.tectonicRegime !== currentRegime) {
      if (currentRegime !== null) {
        segments.push({ startMya: segStart, endMya: state.timeMya, regime: currentRegime });
      }
      currentRegime = state.tectonicRegime;
      segStart = state.timeMya;
    }
  }
  if (currentRegime !== null) {
    segments.push({ startMya: segStart, endMya: 4500, regime: currentRegime });
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        Tectonic Regime Timeline
      </h3>
      <div className="text-[10px] text-muted mb-2">
        Heuristic classification — speculative for t {'>'} 500 Ma
      </div>

      {/* Regime bar */}
      <div className="relative h-8 rounded-full overflow-hidden">
        {segments.map((seg, i) => {
          const left = (seg.startMya / 4500) * 100;
          const width = ((seg.endMya - seg.startMya) / 4500) * 100;
          const cfg = REGIME_CONFIG[seg.regime];
          return (
            <div
              key={i}
              className="absolute top-0 h-full flex items-center justify-center text-[9px] font-medium text-white/80 overflow-hidden"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: cfg.color,
              }}
              title={`${cfg.label}: ${seg.startMya}–${seg.endMya} Ma`}
            >
              {width > 8 && cfg.label}
            </div>
          );
        })}
        {/* Current time indicator */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white/60"
          style={{ left: `${(timeMya / 4500) * 100}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(REGIME_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1 text-[10px] text-muted">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </div>
        ))}
      </div>
    </div>
  );
}
