"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useEarthChatRuntime } from "./use-earth-chat-runtime";
import { EarthAssistantChatTransport } from "@/lib/earth-assistant-chat-transport";
import { useStore } from "@/store/useStore";
import { EMPIRICAL_CONSTRAINTS } from "@/engine/constraints";
import { computePlanetaryState } from "@/engine/physics";
import { PhysicsEngineTools } from "./physics-engine-tools";

export type ChatMode = "hidden" | "bubble" | "pane";

type AssistantContextValue = {
  ready: boolean;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
};

const STORAGE_KEY = "earth-assistant-mode";
const DEFAULT_MODE: ChatMode = "bubble";

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

function readStoredMode(): ChatMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "hidden" || v === "bubble" || v === "pane") return v;
  return isMobile() ? "hidden" : DEFAULT_MODE;
}

const AssistantCtx = createContext<AssistantContextValue>({
  ready: false,
  mode: "hidden",
  setMode: () => {},
});

export function useAssistantUI() {
  return useContext(AssistantCtx);
}

function buildPageContext() {
  const state = useStore.getState();
  const { activeTab, activeParams, timeMya, currentState, physicsLabParams } =
    state;

  const constraintResults = EMPIRICAL_CONSTRAINTS.map((c) => {
    const s = computePlanetaryState(0, activeParams);
    const result = c.evaluate(s, activeParams);
    return `${c.name}: ${result.status} — ${result.detail}`;
  });

  return {
    activeTab,
    scenarioName: activeParams.name,
    scenarioDescription: activeParams.description,
    radialMode: activeParams.radialMode,
    timeMya,
    radius: (currentState.radius / 1e3).toFixed(1),
    surfaceGravity: currentState.surfaceGravity.toFixed(3),
    meanDensity: currentState.meanDensity.toFixed(0),
    dayLength: currentState.dayLength.toFixed(2),
    expansionRate: (currentState.expansionRate * 1e3).toFixed(4),
    tectonicRegime: currentState.tectonicRegime,
    moiFactor: currentState.moiFactor.toFixed(4),
    oblateness:
      currentState.oblateness > 0
        ? `1/${(1 / currentState.oblateness).toFixed(0)}`
        : "0",
    poleDriftRate: currentState.poleDriftRate.toFixed(3),
    constraintSummary: constraintResults.join("\n"),
    physicsLabMassEarth: physicsLabParams.totalMassEarth.toFixed(2),
    physicsLabRadiusKm: (physicsLabParams.meanRadiusM / 1000).toFixed(0),
    physicsLabDayLengthH: physicsLabParams.dayLengthHours.toFixed(1),
    physicsLabCrustKm: (physicsLabParams.crustThicknessM / 1000).toFixed(0),
  };
}

function AssistantRuntime({ children }: { children: ReactNode }) {
  const runtime = useEarthChatRuntime({
    transport: new EarthAssistantChatTransport({
      api: "/api/chat",
      body: () => ({
        pageContext: buildPageContext(),
      }),
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <PhysicsEngineTools />
      {children}
    </AssistantRuntimeProvider>
  );
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [mode, setModeRaw] = useState<ChatMode>(DEFAULT_MODE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setModeRaw(readStoredMode());
    setHydrated(true);
  }, []);

  const setMode = useCallback((m: ChatMode) => {
    setModeRaw(m);
    localStorage.setItem(STORAGE_KEY, m);
  }, []);

  const value = useMemo(
    () => ({
      ready: true,
      mode: hydrated ? mode : ("hidden" as ChatMode),
      setMode,
    }),
    [hydrated, mode, setMode],
  );

  return (
    <AssistantCtx.Provider value={value}>
      <AssistantRuntime>{children}</AssistantRuntime>
    </AssistantCtx.Provider>
  );
}
