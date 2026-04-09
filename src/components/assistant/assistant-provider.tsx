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
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { DefaultChatTransport } from "ai";
import { useStore } from "@/store/useStore";
import { EMPIRICAL_CONSTRAINTS } from "@/engine/constraints";
import { computePlanetaryState } from "@/engine/physics";

export type ChatMode = "hidden" | "bubble" | "pane";

type AssistantContextValue = {
  ready: boolean;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
};

const STORAGE_KEY = "earth-assistant-mode";
const DEFAULT_MODE: ChatMode = "bubble";

function readStoredMode(): ChatMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "hidden" || v === "bubble" || v === "pane") return v;
  return DEFAULT_MODE;
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
  const { activeTab, activeParams, timeMya, currentState } = state;

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
  };
}

function AssistantRuntime({ children }: { children: ReactNode }) {
  const runtime = useChatRuntime({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        pageContext: buildPageContext(),
      }),
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
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
