'use client';

import { type ReactNode, useState } from 'react';

interface PanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  headerRight?: ReactNode;
}

export function Panel({ title, subtitle, children, collapsible = false, defaultOpen = true, className = '', headerRight }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`bg-surface border border-border rounded-lg overflow-hidden ${className}`}>
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-border ${collapsible ? 'cursor-pointer hover:bg-surface-alt transition-colors' : ''}`}
        onClick={collapsible ? () => setOpen(!open) : undefined}
      >
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {collapsible && (
            <span className="text-muted text-xs">{open ? '▾' : '▸'}</span>
          )}
        </div>
      </div>
      {(!collapsible || open) && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}
