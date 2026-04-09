"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { DefaultChatTransport } from "ai";
import { useStore } from "@/store/useStore";
import { EMPIRICAL_CONSTRAINTS } from "@/engine/constraints";
import { computePlanetaryState } from "@/engine/physics";

type AssistantContextValue = {
  ready: boolean;
};

const AssistantCtx = createContext<AssistantContextValue>({ ready: false });

export function useAssistantContext() {
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
    oblateness: currentState.oblateness > 0 ? `1/${(1 / currentState.oblateness).toFixed(0)}` : "0",
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

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ ready: true }), []);

  return (
    <AssistantCtx.Provider value={value}>
      <AssistantRuntime>{children}</AssistantRuntime>
    </AssistantCtx.Provider>
  );
}
