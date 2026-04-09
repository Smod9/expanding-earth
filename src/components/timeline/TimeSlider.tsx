'use client';

import { useStore } from '@/store/useStore';
import { GEOLOGIC_ERAS, getGeologicLabel, formatTimeMya } from '@/engine/geologic-time';
import { useCallback, useState } from 'react';

export function TimeSlider({ compact = false }: { compact?: boolean }) {
  const { timeMya, setTimeMya } = useStore();
  const [expanded, setExpanded] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTimeMya(Number(e.target.value));
    },
    [setTimeMya],
  );

  const geologicLabel = getGeologicLabel(timeMya);

  if (compact && !expanded) {
    return (
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={() => setExpanded(true)}
          className="text-muted hover:text-foreground text-xs shrink-0"
          title="Expand time controls"
        >
          ▸
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Time</span>
          <span className="text-sm font-bold font-mono">{formatTimeMya(timeMya)}</span>
          <span className="text-[10px] text-accent">{geologicLabel}</span>
        </div>
        {/* Geologic bar — mini */}
        <div className="flex h-1.5 rounded-full overflow-hidden flex-1 min-w-0">
          {GEOLOGIC_ERAS.map((era) => {
            const width = ((era.startMya - era.endMya) / 4500) * 100;
            const isActive = timeMya >= era.endMya && timeMya <= era.startMya;
            return (
              <div
                key={era.name}
                className={`h-full transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}
                style={{ width: `${width}%`, backgroundColor: era.color }}
                title={`${era.name}: ${era.startMya}–${era.endMya} Ma`}
              />
            );
          })}
        </div>
        <input
          type="range"
          min={0}
          max={4500}
          step={1}
          value={timeMya}
          onChange={handleChange}
          className="flex-1 min-w-[120px]"
        />
        <div className="flex gap-1 shrink-0">
          {[0, 252, 541, 2500].map((t) => (
            <button
              key={t}
              onClick={() => setTimeMya(t)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                timeMya === t
                  ? 'bg-accent/20 text-accent'
                  : 'bg-surface-alt text-muted hover:text-foreground'
              }`}
            >
              {t === 0 ? 'Now' : formatTimeMya(t)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {compact && (
            <button
              onClick={() => setExpanded(false)}
              className="text-muted hover:text-foreground text-xs"
              title="Collapse time controls"
            >
              ▾
            </button>
          )}
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Time Explorer</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold font-mono">{formatTimeMya(timeMya)}</span>
          <span className="text-xs text-accent">{geologicLabel}</span>
        </div>
      </div>

      {/* Geologic bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-2">
        {GEOLOGIC_ERAS.map((era) => {
          const width = ((era.startMya - era.endMya) / 4500) * 100;
          const isActive = timeMya >= era.endMya && timeMya <= era.startMya;
          return (
            <div
              key={era.name}
              className={`h-full transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
              style={{ width: `${width}%`, backgroundColor: era.color }}
              title={`${era.name}: ${era.startMya}–${era.endMya} Ma`}
            />
          );
        })}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={4500}
        step={1}
        value={timeMya}
        onChange={handleChange}
        className="w-full"
      />

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted mt-1">
        <span>Present</span>
        <span>1 Ga</span>
        <span>2 Ga</span>
        <span>3 Ga</span>
        <span>4.5 Ga</span>
      </div>

      {/* Quick jump buttons */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {[0, 66, 252, 541, 1000, 2500, 4000, 4500].map((t) => (
          <button
            key={t}
            onClick={() => setTimeMya(t)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              timeMya === t
                ? 'bg-accent/20 text-accent'
                : 'bg-surface-alt text-muted hover:text-foreground'
            }`}
          >
            {t === 0 ? 'Now' : formatTimeMya(t)}
          </button>
        ))}
      </div>
    </div>
  );
}
