'use client';

import { useStore } from '@/store/useStore';
import { EMPIRICAL_CONSTRAINTS } from '@/engine/constraints';
import { ConstraintBadge } from '../ui/ConstraintBadge';
import { EpistemicBadge } from '../ui/EpistemicBadge';
import { Panel } from '../ui/Panel';
import type { ConstraintResult } from '@/engine/types';

export function ConstraintsPanel() {
  const { currentState, activeParams, timeMya } = useStore();

  const results = EMPIRICAL_CONSTRAINTS.map((constraint) => ({
    constraint,
    result: constraint.evaluate(currentState, activeParams),
  }));

  const summary = {
    compatible: results.filter((r) => r.result.status === 'compatible').length,
    strained: results.filter((r) => r.result.status === 'strained').length,
    incompatible: results.filter((r) => r.result.status === 'incompatible').length,
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Evidence & Constraints</h2>
        <p className="text-sm text-muted max-w-2xl mx-auto">
          How does the current model scenario ({activeParams.name}) compare against
          real-world observations at t = {timeMya === 0 ? 'present' : `${timeMya} Ma`}?
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex justify-center gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-compatible">{summary.compatible}</div>
          <div className="text-xs text-muted">Compatible</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-strained">{summary.strained}</div>
          <div className="text-xs text-muted">Strained</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-incompatible">{summary.incompatible}</div>
          <div className="text-xs text-muted">Incompatible</div>
        </div>
      </div>

      {/* Visual bar */}
      <div className="flex h-3 rounded-full overflow-hidden max-w-md mx-auto">
        {summary.compatible > 0 && (
          <div className="h-full bg-compatible" style={{ width: `${(summary.compatible / results.length) * 100}%` }} />
        )}
        {summary.strained > 0 && (
          <div className="h-full bg-strained" style={{ width: `${(summary.strained / results.length) * 100}%` }} />
        )}
        {summary.incompatible > 0 && (
          <div className="h-full bg-incompatible" style={{ width: `${(summary.incompatible / results.length) * 100}%` }} />
        )}
      </div>

      {/* Constraint cards */}
      <div className="space-y-4">
        {results.map(({ constraint, result }) => (
          <ConstraintCard key={constraint.id} constraint={constraint} result={result} />
        ))}
      </div>
    </div>
  );
}

function ConstraintCard({
  constraint,
  result,
}: {
  constraint: typeof EMPIRICAL_CONSTRAINTS[0];
  result: ConstraintResult;
}) {
  return (
    <div className={`bg-surface border rounded-lg p-4 ${
      result.status === 'compatible' ? 'border-compatible/30' :
      result.status === 'strained' ? 'border-strained/30' :
      'border-incompatible/30'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold">{constraint.name}</h3>
            <EpistemicBadge tag={constraint.epistemicTag} />
            <span className="text-[10px] text-muted px-1.5 py-0.5 bg-surface-alt rounded">{constraint.category}</span>
          </div>
          <p className="text-xs text-muted">{constraint.description}</p>
        </div>
        <ConstraintBadge status={result.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-2 rounded bg-surface-alt">
          <div className="font-medium text-observed mb-1">Observation</div>
          <p className="text-muted">{constraint.observation}</p>
        </div>
        <div className="p-2 rounded bg-surface-alt">
          <div className="font-medium text-accent mb-1">Mainstream Interpretation</div>
          <p className="text-muted">{constraint.mainstreamInterpretation}</p>
        </div>
        <div className="p-2 rounded bg-surface-alt">
          <div className="font-medium text-speculative mb-1">Alternative Interpretation</div>
          <p className="text-muted">{constraint.alternativeInterpretation}</p>
        </div>
      </div>

      <div className="mt-3 p-2 rounded bg-surface-alt">
        <div className="text-xs font-medium mb-1">Model Assessment</div>
        <p className="text-xs text-muted">{result.detail}</p>
        {result.quantitative && (
          <div className="mt-1 text-[10px] font-mono text-muted">
            Model: {result.quantitative.modelValue.toFixed(4)} {result.quantitative.unit} |
            Observed: {result.quantitative.observedValue} ± {result.quantitative.tolerance} {result.quantitative.unit}
          </div>
        )}
      </div>
    </div>
  );
}
