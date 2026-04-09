'use client';

import { useStore } from '@/store/useStore';
import { SEED_SCENARIOS } from '@/engine/scenarios';
import { EARTH_RADIUS, EARTH_MASS } from '@/engine/constants';
import { Panel } from '../ui/Panel';
import type { RadialMode, AngularMomentumMode } from '@/engine/types';

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  formatDisplay,
  tooltip,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  formatDisplay?: (v: number) => string;
  tooltip?: string;
}) {
  const display = formatDisplay ? formatDisplay(value) : value.toFixed(step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0);
  return (
    <div className="space-y-1" title={tooltip}>
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted">{label}</label>
        <span className="text-xs font-mono">
          {display} <span className="text-muted">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export function ScenarioControls() {
  const { activeParams, setActiveParams, updateParam, controlsOpen, setControlsOpen } = useStore();

  return (
    <div className="space-y-3">
      {/* Preset selector */}
      <Panel title="Scenario" subtitle={activeParams.name}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-1.5">
            {SEED_SCENARIOS.map((scenario) => (
              <button
                key={scenario.name}
                onClick={() => setActiveParams({ ...scenario })}
                className={`text-left px-3 py-2 rounded-md text-xs transition-colors ${
                  activeParams.name === scenario.name
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-surface-alt text-muted hover:text-foreground border border-transparent'
                }`}
              >
                <div className="font-medium">{scenario.name}</div>
                <div className="text-[10px] opacity-70 mt-0.5 line-clamp-2">{scenario.description}</div>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <button
        onClick={() => setControlsOpen(!controlsOpen)}
        className="w-full text-xs text-muted hover:text-foreground py-1 text-center transition-colors"
      >
        {controlsOpen ? '▾ Hide parameter controls' : '▸ Show parameter controls'}
      </button>

      {controlsOpen && (
        <>
          {/* Radial evolution */}
          <Panel title="Radial Evolution" collapsible defaultOpen>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Mode</label>
                <select
                  value={activeParams.radialMode}
                  onChange={(e) => updateParam('radialMode', e.target.value as RadialMode)}
                  className="w-full bg-surface-alt border border-border rounded px-2 py-1.5 text-xs"
                >
                  <option value="none">No radial change</option>
                  <option value="linear">Linear (constant rate)</option>
                  <option value="exponential">Exponential (front-loaded)</option>
                  <option value="episodic">Episodic pulses</option>
                </select>
              </div>

              {activeParams.radialMode !== 'none' && (
                <SliderControl
                  label="Initial Radius"
                  value={activeParams.initialRadius / 1e3}
                  min={EARTH_RADIUS * 0.4 / 1e3}
                  max={EARTH_RADIUS * 1.05 / 1e3}
                  step={10}
                  unit="km"
                  onChange={(v) => updateParam('initialRadius', v * 1e3)}
                  formatDisplay={(v) => v.toFixed(0)}
                  tooltip="Radius at 4.5 Ga"
                />
              )}

              {activeParams.radialMode === 'linear' && (
                <SliderControl
                  label="Expansion Rate"
                  value={activeParams.linearRate * 1e3}
                  min={0}
                  max={5}
                  step={0.01}
                  unit="mm/yr"
                  onChange={(v) => updateParam('linearRate', v / 1e3)}
                  formatDisplay={(v) => v.toFixed(2)}
                />
              )}

              {activeParams.radialMode === 'exponential' && (
                <SliderControl
                  label="E-folding Time"
                  value={activeParams.exponentialTau}
                  min={100}
                  max={3000}
                  step={50}
                  unit="Myr"
                  onChange={(v) => updateParam('exponentialTau', v)}
                />
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="massFixed"
                  checked={activeParams.massFixed}
                  onChange={(e) => updateParam('massFixed', e.target.checked)}
                  className="accent-accent"
                />
                <label htmlFor="massFixed" className="text-xs text-muted">
                  Mass conserved (density changes with radius)
                </label>
              </div>
            </div>
          </Panel>

          {/* Rotation */}
          <Panel title="Rotation" collapsible defaultOpen={false}>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Angular Momentum</label>
                <select
                  value={activeParams.angularMomentumMode}
                  onChange={(e) => updateParam('angularMomentumMode', e.target.value as AngularMomentumMode)}
                  className="w-full bg-surface-alt border border-border rounded px-2 py-1.5 text-xs"
                >
                  <option value="conserved">Conserved (ω adjusts with I)</option>
                  <option value="fixed_spin">Fixed spin rate</option>
                  <option value="tidal_loss">Tidal braking</option>
                </select>
              </div>

              <SliderControl
                label="Present Day Length"
                value={activeParams.presentDayLength}
                min={20}
                max={30}
                step={0.1}
                unit="hr"
                onChange={(v) => updateParam('presentDayLength', v)}
              />

              {activeParams.angularMomentumMode === 'tidal_loss' && (
                <SliderControl
                  label="Tidal Braking Rate"
                  value={activeParams.tidalBrakingRate * 1e5}
                  min={0.1}
                  max={50}
                  step={0.1}
                  unit="×10⁻⁵ /Myr"
                  onChange={(v) => updateParam('tidalBrakingRate', v / 1e5)}
                  formatDisplay={(v) => v.toFixed(1)}
                />
              )}
            </div>
          </Panel>

          {/* Layering */}
          <Panel title="Interior Structure" collapsible defaultOpen={false}>
            <div className="space-y-3">
              <SliderControl
                label="Core Radius Fraction"
                value={activeParams.coreRadiusFraction}
                min={0.2}
                max={0.7}
                step={0.01}
                unit=""
                onChange={(v) => updateParam('coreRadiusFraction', v)}
              />
              <SliderControl
                label="Core Density"
                value={activeParams.coreDensity}
                min={8000}
                max={14000}
                step={100}
                unit="kg/m³"
                onChange={(v) => updateParam('coreDensity', v)}
              />
              <SliderControl
                label="Mantle Density"
                value={activeParams.mantleDensity}
                min={3000}
                max={6000}
                step={100}
                unit="kg/m³"
                onChange={(v) => updateParam('mantleDensity', v)}
              />
            </div>
          </Panel>

          {/* Relaxation & Dynamics */}
          <Panel title="Relaxation & Dynamics" collapsible defaultOpen={false}>
            <div className="space-y-3">
              <SliderControl
                label="Relaxation Timescale"
                value={activeParams.relaxationTimescale}
                min={0.1}
                max={100}
                step={0.5}
                unit="Myr"
                onChange={(v) => updateParam('relaxationTimescale', v)}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="poleEnabled"
                  checked={activeParams.poleReorientationEnabled}
                  onChange={(e) => updateParam('poleReorientationEnabled', e.target.checked)}
                  className="accent-accent"
                />
                <label htmlFor="poleEnabled" className="text-xs text-muted">
                  Enable pole reorientation
                </label>
              </div>

              {activeParams.poleReorientationEnabled && (
                <>
                  <SliderControl
                    label="Pole Sensitivity"
                    value={activeParams.poleReorientationSensitivity}
                    min={0}
                    max={5}
                    step={0.1}
                    unit=""
                    onChange={(v) => updateParam('poleReorientationSensitivity', v)}
                  />
                  <SliderControl
                    label="Asymmetry Strength"
                    value={activeParams.asymmetryStrength}
                    min={0}
                    max={1}
                    step={0.01}
                    unit=""
                    onChange={(v) => updateParam('asymmetryStrength', v)}
                  />
                </>
              )}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
