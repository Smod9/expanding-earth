'use client';

import type { EpistemicTag } from '@/engine/types';

const config: Record<EpistemicTag, { label: string; className: string; title: string }> = {
  observed: {
    label: 'Observed',
    className: 'bg-observed/15 text-observed border-observed/30',
    title: 'Based on direct measurement or observation',
  },
  inferred: {
    label: 'Inferred',
    className: 'bg-inferred/15 text-inferred border-inferred/30',
    title: 'Derived from observations using accepted methods',
  },
  modeled: {
    label: 'Modeled',
    className: 'bg-modeled/15 text-modeled border-modeled/30',
    title: 'Computed from model equations — depends on assumptions',
  },
  speculative: {
    label: 'Speculative',
    className: 'bg-speculative/15 text-speculative border-speculative/30',
    title: 'Exploratory / hypothetical — not established science',
  },
};

export function EpistemicBadge({ tag }: { tag: EpistemicTag }) {
  const c = config[tag];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${c.className}`}
      title={c.title}
    >
      {c.label}
    </span>
  );
}
