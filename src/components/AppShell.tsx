'use client';

import { useStore, type ActiveTab } from '@/store/useStore';
import { OverviewPanel } from './overview/OverviewPanel';
import { ExplorerPanel } from './timeline/ExplorerPanel';
import { ConstraintsPanel } from './constraints/ConstraintsPanel';
import { ComparisonPanel } from './comparison/ComparisonPanel';
import { ExportPanel } from './export/ExportPanel';
import { TimeSlider } from './timeline/TimeSlider';
import { ChatPane } from './assistant/chat-pane';
import { PhysicsLabPanel } from './physics-lab/PhysicsLabPanel';

const tabs: { id: ActiveTab; label: string; desc: string }[] = [
  { id: 'overview', label: 'Overview', desc: 'Hypothesis framing' },
  { id: 'explorer', label: 'Explorer', desc: 'Time & model explorer' },
  { id: 'constraints', label: 'Constraints', desc: 'Evidence overlay' },
  { id: 'comparison', label: 'Compare', desc: 'Model comparison' },
  { id: 'export', label: 'Export', desc: 'Save & export' },
  { id: 'physics_lab', label: 'Physics Lab', desc: 'Pure rotating-body mechanics' },
];

const TABS_WITH_TIME = new Set<ActiveTab>(['explorer', 'constraints', 'comparison']);

export function AppShell() {
  const { activeTab, setActiveTab, darkMode, toggleDarkMode } = useStore();

  const showTimebar = TABS_WITH_TIME.has(activeTab);

  return (
    <div className={`${darkMode ? '' : 'light'} flex h-screen flex-col bg-background text-foreground`}>
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-accent font-bold text-sm">E</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight">Planetary Dynamics Explorer</h1>
              <p className="text-[10px] text-muted">Model exploration tool — not an endorsement of any claim</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted hover:text-foreground hover:bg-surface-alt'
                }`}
                title={tab.desc}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleDarkMode}
            className="px-2 py-1.5 rounded-md text-xs text-muted hover:text-foreground hover:bg-surface-alt transition-colors"
            title="Toggle dark/light mode"
          >
            {darkMode ? '☀' : '☽'}
          </button>
        </div>

        {/* Sticky time bar — shown on Explorer, Constraints, Comparison */}
        {showTimebar && (
          <div className="border-t border-border bg-surface/90 backdrop-blur-sm px-4 py-2 max-w-[1800px] mx-auto">
            <TimeSlider compact />
          </div>
        )}
      </header>

      {/* Body: main content + optional chat pane */}
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="max-w-[1800px] mx-auto">
            {activeTab === 'overview' && <OverviewPanel />}
            {activeTab === 'explorer' && <ExplorerPanel />}
            {activeTab === 'constraints' && <ConstraintsPanel />}
            {activeTab === 'comparison' && <ComparisonPanel />}
            {activeTab === 'export' && <ExportPanel />}
            {activeTab === 'physics_lab' && <PhysicsLabPanel />}
          </div>
        </main>
        <ChatPane />
      </div>
    </div>
  );
}
