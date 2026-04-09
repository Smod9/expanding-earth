'use client';

import type { ConstraintResult } from '@/engine/types';

const statusConfig: Record<ConstraintResult['status'], { label: string; className: string; icon: string }> = {
  compatible: {
    label: 'Compatible',
    className: 'bg-compatible/15 text-compatible border-compatible/30',
    icon: '✓',
  },
  strained: {
    label: 'Strained',
    className: 'bg-strained/15 text-strained border-strained/30',
    icon: '⚠',
  },
  incompatible: {
    label: 'Incompatible',
    className: 'bg-incompatible/15 text-incompatible border-incompatible/30',
    icon: '✗',
  },
};

export function ConstraintBadge({ status }: { status: ConstraintResult['status'] }) {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium border ${c.className}`}>
      <span>{c.icon}</span>
      <span className="hidden sm:inline">{c.label}</span>
    </span>
  );
}
