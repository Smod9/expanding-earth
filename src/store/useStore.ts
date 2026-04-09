import { create } from 'zustand';
import type { ScenarioParams, PlanetaryState, SavedScenario } from '@/engine/types';
import { SEED_SCENARIOS, getDefaultScenario } from '@/engine/scenarios';
import { computePlanetaryState, computeTimeSeries } from '@/engine/physics';

export type ActiveTab = 'overview' | 'explorer' | 'constraints' | 'comparison' | 'export';

interface ComparisonSlot {
  label: string;
  params: ScenarioParams;
  timeSeries: PlanetaryState[];
}

interface AppState {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Time
  timeMya: number;
  setTimeMya: (t: number) => void;

  // Scenario
  activeParams: ScenarioParams;
  setActiveParams: (p: ScenarioParams) => void;
  updateParam: <K extends keyof ScenarioParams>(key: K, value: ScenarioParams[K]) => void;

  // Computed
  currentState: PlanetaryState;
  timeSeries: PlanetaryState[];
  recompute: () => void;

  // Saved scenarios
  savedScenarios: SavedScenario[];
  saveScenario: (notes: string) => void;
  loadScenario: (id: string) => void;
  deleteSavedScenario: (id: string) => void;

  // Comparison
  comparisonSlots: ComparisonSlot[];
  setComparisonSlot: (index: number, params: ScenarioParams) => void;
  clearComparisonSlot: (index: number) => void;

  // Dark mode
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Controls panel open
  controlsOpen: boolean;
  setControlsOpen: (open: boolean) => void;
}

const defaultParams = getDefaultScenario();
const defaultState = computePlanetaryState(0, defaultParams);
const defaultTimeSeries = computeTimeSeries(defaultParams, 200, 0, 4500);

export const useStore = create<AppState>((set, get) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),

  timeMya: 0,
  setTimeMya: (t) => {
    const state = computePlanetaryState(t, get().activeParams);
    set({ timeMya: t, currentState: state });
  },

  activeParams: defaultParams,
  setActiveParams: (p) => {
    const ts = computeTimeSeries(p, 200, 0, 4500);
    const state = computePlanetaryState(get().timeMya, p);
    set({ activeParams: p, timeSeries: ts, currentState: state });
  },
  updateParam: (key, value) => {
    const newParams = { ...get().activeParams, [key]: value };
    const ts = computeTimeSeries(newParams, 200, 0, 4500);
    const state = computePlanetaryState(get().timeMya, newParams);
    set({ activeParams: newParams, timeSeries: ts, currentState: state });
  },

  currentState: defaultState,
  timeSeries: defaultTimeSeries,
  recompute: () => {
    const { activeParams, timeMya } = get();
    const ts = computeTimeSeries(activeParams, 200, 0, 4500);
    const state = computePlanetaryState(timeMya, activeParams);
    set({ timeSeries: ts, currentState: state });
  },

  savedScenarios: [],
  saveScenario: (notes) => {
    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      params: { ...get().activeParams },
      createdAt: Date.now(),
      notes,
    };
    set({ savedScenarios: [...get().savedScenarios, scenario] });
  },
  loadScenario: (id) => {
    const found = get().savedScenarios.find((s) => s.id === id);
    if (found) {
      get().setActiveParams({ ...found.params });
    }
  },
  deleteSavedScenario: (id) => {
    set({ savedScenarios: get().savedScenarios.filter((s) => s.id !== id) });
  },

  comparisonSlots: [
    { label: 'Model A', params: SEED_SCENARIOS[0], timeSeries: computeTimeSeries(SEED_SCENARIOS[0], 200, 0, 4500) },
    { label: 'Model B', params: SEED_SCENARIOS[4], timeSeries: computeTimeSeries(SEED_SCENARIOS[4], 200, 0, 4500) },
  ],
  setComparisonSlot: (index, params) => {
    const slots = [...get().comparisonSlots];
    slots[index] = { ...slots[index], params, timeSeries: computeTimeSeries(params, 200, 0, 4500) };
    set({ comparisonSlots: slots });
  },
  clearComparisonSlot: (index) => {
    const slots = [...get().comparisonSlots];
    const def = getDefaultScenario();
    slots[index] = { label: slots[index].label, params: def, timeSeries: computeTimeSeries(def, 200, 0, 4500) };
    set({ comparisonSlots: slots });
  },

  darkMode: true,
  toggleDarkMode: () => set({ darkMode: !get().darkMode }),

  controlsOpen: true,
  setControlsOpen: (open) => set({ controlsOpen: open }),
}));
