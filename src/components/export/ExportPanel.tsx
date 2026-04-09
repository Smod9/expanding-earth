'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { EMPIRICAL_CONSTRAINTS } from '@/engine/constraints';
import { computePlanetaryState } from '@/engine/physics';
import { Panel } from '../ui/Panel';
import { formatTimeMya } from '@/engine/geologic-time';

export function ExportPanel() {
  const { activeParams, timeSeries, currentState, savedScenarios, saveScenario, loadScenario, deleteSavedScenario, timeMya } = useStore();
  const [saveNotes, setSaveNotes] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = () => {
    saveScenario(saveNotes);
    setSaveNotes('');
    setSavedMsg('Scenario saved.');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const exportJSON = () => {
    const data = {
      scenario: activeParams,
      exportedAt: new Date().toISOString(),
      currentTime: timeMya,
      currentState,
    };
    downloadFile(JSON.stringify(data, null, 2), `scenario-${activeParams.name.replace(/\s+/g, '-')}.json`, 'application/json');
  };

  const exportCSV = () => {
    const headers = [
      'timeMya', 'radius_m', 'equatorialRadius_m', 'polarRadius_m',
      'oblateness', 'totalMass_kg', 'meanDensity_kgm3', 'surfaceGravity_ms2',
      'angularVelocity_rads', 'dayLength_hr', 'momentOfInertia_kgm2',
      'moiFactor', 'expansionRate_myr', 'poleDriftRate_degMyr',
      'tectonicRegime', 'relaxationFraction',
    ];
    const rows = timeSeries.map((s) => [
      s.timeMya, s.radius, s.equatorialRadius, s.polarRadius,
      s.oblateness, s.totalMass, s.meanDensity, s.surfaceGravity,
      s.angularVelocity, s.dayLength, s.momentOfInertia,
      s.moiFactor, s.expansionRate, s.poleDriftRate,
      s.tectonicRegime, s.relaxationFraction,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `timeseries-${activeParams.name.replace(/\s+/g, '-')}.csv`, 'text/csv');
  };

  const generateSummary = (): string => {
    const presentState = computePlanetaryState(0, activeParams);
    const constraintResults = EMPIRICAL_CONSTRAINTS.map((c) => ({
      name: c.name,
      result: c.evaluate(presentState, activeParams),
    }));

    const compatible = constraintResults.filter((r) => r.result.status === 'compatible');
    const strained = constraintResults.filter((r) => r.result.status === 'strained');
    const incompatible = constraintResults.filter((r) => r.result.status === 'incompatible');

    let summary = `# Scenario Summary: ${activeParams.name}\n\n`;
    summary += `## Description\n${activeParams.description}\n\n`;
    summary += `## Key Assumptions\n`;
    summary += `- Radial mode: ${activeParams.radialMode}\n`;
    if (activeParams.radialMode !== 'none') {
      summary += `- Initial radius: ${(activeParams.initialRadius / 1e3).toFixed(0)} km (${((activeParams.initialRadius / activeParams.presentRadius) * 100).toFixed(1)}% of present)\n`;
    }
    summary += `- Mass: ${activeParams.massFixed ? 'Conserved' : 'Variable'}\n`;
    summary += `- Angular momentum: ${activeParams.angularMomentumMode}\n`;
    summary += `- Pole reorientation: ${activeParams.poleReorientationEnabled ? 'Enabled' : 'Disabled'}\n\n`;

    summary += `## Present-Day Model Values\n`;
    summary += `- Radius: ${(presentState.radius / 1e3).toFixed(1)} km\n`;
    summary += `- Surface gravity: ${presentState.surfaceGravity.toFixed(3)} m/s²\n`;
    summary += `- Mean density: ${presentState.meanDensity.toFixed(0)} kg/m³\n`;
    summary += `- Day length: ${presentState.dayLength.toFixed(2)} hr\n`;
    summary += `- Oblateness: ${presentState.oblateness > 0 ? `1/${(1 / presentState.oblateness).toFixed(0)}` : 'N/A'}\n`;
    summary += `- MoI factor: ${presentState.moiFactor.toFixed(4)}\n`;
    summary += `- Expansion rate: ${(presentState.expansionRate * 1e3).toFixed(4)} mm/yr\n\n`;

    summary += `## Constraint Assessment (Present Day)\n\n`;
    if (compatible.length > 0) {
      summary += `### Compatible (${compatible.length})\n`;
      compatible.forEach((r) => { summary += `- ${r.name}: ${r.result.detail}\n`; });
      summary += '\n';
    }
    if (strained.length > 0) {
      summary += `### Strained (${strained.length})\n`;
      strained.forEach((r) => { summary += `- ${r.name}: ${r.result.detail}\n`; });
      summary += '\n';
    }
    if (incompatible.length > 0) {
      summary += `### Incompatible (${incompatible.length})\n`;
      incompatible.forEach((r) => { summary += `- ${r.name}: ${r.result.detail}\n`; });
      summary += '\n';
    }

    summary += `## Where This Model Conflicts With Current Evidence\n\n`;
    if (incompatible.length === 0 && strained.length === 0) {
      summary += `This scenario is broadly consistent with known constraints at present day.\n`;
    } else {
      if (incompatible.length > 0) {
        summary += `**Hard conflicts:** ${incompatible.map((r) => r.name).join(', ')}\n`;
      }
      if (strained.length > 0) {
        summary += `**Tensions:** ${strained.map((r) => r.name).join(', ')}\n`;
      }
    }

    summary += `\n---\nGenerated by Planetary Dynamics Explorer | ${new Date().toISOString()}\n`;
    summary += `This is a model-exploration tool, not an endorsement of any claim.\n`;

    return summary;
  };

  const exportSummary = () => {
    const summary = generateSummary();
    downloadFile(summary, `summary-${activeParams.name.replace(/\s+/g, '-')}.md`, 'text/markdown');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Export & Save</h2>
        <p className="text-sm text-muted">Save scenarios, export data, and generate summaries.</p>
      </div>

      {/* Save scenario */}
      <Panel title="Save Current Scenario">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Notes</label>
            <textarea
              value={saveNotes}
              onChange={(e) => setSaveNotes(e.target.value)}
              placeholder="Optional notes about this configuration..."
              className="w-full bg-surface-alt border border-border rounded px-3 py-2 text-sm resize-none h-20"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-accent/15 text-accent text-sm font-medium hover:bg-accent/25 transition-colors"
            >
              Save Scenario
            </button>
            {savedMsg && <span className="text-xs text-compatible">{savedMsg}</span>}
          </div>
        </div>
      </Panel>

      {/* Saved scenarios */}
      {savedScenarios.length > 0 && (
        <Panel title={`Saved Scenarios (${savedScenarios.length})`}>
          <div className="space-y-2">
            {savedScenarios.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-surface-alt rounded-lg">
                <div>
                  <div className="text-sm font-medium">{s.params.name}</div>
                  <div className="text-[10px] text-muted">
                    {new Date(s.createdAt).toLocaleString()}
                    {s.notes && ` — ${s.notes}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadScenario(s.id)}
                    className="px-3 py-1 rounded text-xs bg-accent/15 text-accent hover:bg-accent/25"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteSavedScenario(s.id)}
                    className="px-3 py-1 rounded text-xs bg-incompatible/15 text-incompatible hover:bg-incompatible/25"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Export options */}
      <Panel title="Export Data">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={exportJSON}
            className="p-4 rounded-lg bg-surface-alt border border-border hover:border-accent/30 transition-colors text-left"
          >
            <div className="text-sm font-medium mb-1">Export JSON</div>
            <div className="text-[10px] text-muted">Full scenario parameters and current state</div>
          </button>
          <button
            onClick={exportCSV}
            className="p-4 rounded-lg bg-surface-alt border border-border hover:border-accent/30 transition-colors text-left"
          >
            <div className="text-sm font-medium mb-1">Export CSV</div>
            <div className="text-[10px] text-muted">Complete time-series data for all computed quantities</div>
          </button>
          <button
            onClick={exportSummary}
            className="p-4 rounded-lg bg-surface-alt border border-border hover:border-accent/30 transition-colors text-left"
          >
            <div className="text-sm font-medium mb-1">Generate Summary</div>
            <div className="text-[10px] text-muted">Written report of assumptions, results, and constraint conflicts</div>
          </button>
        </div>
      </Panel>

      {/* Preview summary */}
      <Panel title="Summary Preview" collapsible defaultOpen={false}>
        <pre className="text-[11px] text-muted whitespace-pre-wrap font-mono leading-relaxed bg-surface-alt rounded-lg p-4 max-h-96 overflow-y-auto scrollbar-thin">
          {generateSummary()}
        </pre>
      </Panel>
    </div>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
