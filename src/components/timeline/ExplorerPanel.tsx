'use client';

import { TimeSlider } from './TimeSlider';
import { StateReadout } from './StateReadout';
import { ScenarioControls } from '../controls/ScenarioControls';
import { TimeSeriesCharts } from '../visualization/TimeSeriesCharts';
import { PlanetCrossSection } from '../visualization/PlanetCrossSection';
import { RegimeTimeline } from '../visualization/RegimeTimeline';
import { useStore } from '@/store/useStore';
import { Panel } from '../ui/Panel';

export function ExplorerPanel() {
  const { activeParams } = useStore();

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Time slider — full width */}
      <TimeSlider />

      {/* Main grid: controls | visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Left sidebar — controls */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin pr-1">
          <ScenarioControls />
        </div>

        {/* Right — visualizations */}
        <div className="space-y-4">
          {/* Top row: planet vis + state readout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
            <PlanetCrossSection />
            <StateReadout />
          </div>

          {/* Regime timeline */}
          <RegimeTimeline />

          {/* Model assumptions */}
          <Panel title="Active Model Assumptions" collapsible defaultOpen={false}>
            <div className="text-xs text-muted space-y-1">
              <p><strong>Radial mode:</strong> {activeParams.radialMode === 'none' ? 'Constant radius (mainstream)' : activeParams.radialMode}</p>
              {activeParams.radialMode !== 'none' && (
                <p><strong>Initial radius:</strong> {(activeParams.initialRadius / 1e3).toFixed(0)} km ({((activeParams.initialRadius / activeParams.presentRadius) * 100).toFixed(1)}% of present)</p>
              )}
              <p><strong>Mass:</strong> {activeParams.massFixed ? 'Conserved' : 'Variable (constant density)'}</p>
              <p><strong>Angular momentum:</strong> {activeParams.angularMomentumMode}</p>
              <p><strong>Pole reorientation:</strong> {activeParams.poleReorientationEnabled ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Relaxation timescale:</strong> {activeParams.relaxationTimescale} Myr</p>
              <p className="mt-2 italic">All quantities are toy-model approximations. See Overview for full disclaimers.</p>
            </div>
          </Panel>

          {/* Charts */}
          <TimeSeriesCharts />
        </div>
      </div>
    </div>
  );
}
