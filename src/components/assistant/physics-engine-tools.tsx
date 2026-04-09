"use client";

import { useAssistantInstructions, useAssistantTool } from "@assistant-ui/react";
import { useStore, type ActiveTab } from "@/store/useStore";
import { SEED_SCENARIOS } from "@/engine/scenarios";
import { applyScenarioPatch } from "@/engine/scenario-patch";
import { applyPhysicsLabParamsPatch } from "@/engine/pure-physics";

const TABS: ActiveTab[] = [
  "overview",
  "explorer",
  "constraints",
  "comparison",
  "export",
  "physics_lab",
];

export function PhysicsEngineTools() {
  useAssistantInstructions({
    instruction: `You have tools to control the running app. Use them when the user asks to change parameters, jump in time, switch tabs, load a built-in scenario, or adjust the Physics Lab model.
- Explorer scenarios use SI units where relevant: presentRadius and initialRadius in meters, totalMass in kg, presentDayLength in hours.
- Physics Lab: totalMassEarth is in Earth masses; meanRadiusM is meters (e.g. 6.371e6); dayLengthHours in hours.`,
  });

  useAssistantTool({
    type: "frontend",
    toolName: "set_active_tab",
    description:
      "Show a main app tab (Overview, Explorer with the time slider, Constraints, Compare, Export, or Physics Lab).",
    parameters: {
      type: "object",
      properties: {
        tab: {
          type: "string",
          enum: TABS,
          description: "Target tab id.",
        },
      },
      required: ["tab"],
      additionalProperties: false,
    },
    async execute(args: { tab: ActiveTab }) {
      useStore.getState().setActiveTab(args.tab);
      return { ok: true as const, tab: args.tab };
    },
  });

  useAssistantTool({
    type: "frontend",
    toolName: "set_time_mya",
    description:
      "Set geologic time for Explorer / Constraints / Comparison (millions of years ago: 0 = present, ~4500 = early Earth).",
    parameters: {
      type: "object",
      properties: {
        timeMya: {
          type: "number",
          minimum: 0,
          maximum: 4500,
          description: "Time in Ma (mega-annum) before present.",
        },
      },
      required: ["timeMya"],
      additionalProperties: false,
    },
    async execute(args: { timeMya: number }) {
      useStore.getState().setTimeMya(args.timeMya);
      return { ok: true as const, timeMya: args.timeMya };
    },
  });

  useAssistantTool({
    type: "frontend",
    toolName: "load_seed_scenario",
    description:
      "Load one of the five built-in seed scenarios into the Explorer engine (recomputes time series). Index 0 = Standard no expansion; 1 = Tiny expansion; 2 = Classical expansion; 3 = Episodic; 4 = Hybrid. Alternatively pass nameContains to match by name substring.",
    parameters: {
      type: "object",
      properties: {
        index: {
          type: "integer",
          minimum: 0,
          maximum: SEED_SCENARIOS.length - 1,
          description: "Seed scenario index 0–4.",
        },
        nameContains: {
          type: "string",
          description:
            "Case-insensitive substring of the scenario name (used if index is omitted).",
        },
      },
      additionalProperties: false,
    },
    async execute(args: { index?: number; nameContains?: string }) {
      let picked = SEED_SCENARIOS[0];
      let matchedBy: "index" | "name" | "default" = "default";

      if (typeof args.index === "number") {
        picked = SEED_SCENARIOS[args.index];
        matchedBy = "index";
      } else if (args.nameContains?.trim()) {
        const q = args.nameContains.trim().toLowerCase();
        const found = SEED_SCENARIOS.find((s) =>
          s.name.toLowerCase().includes(q),
        );
        if (found) {
          picked = found;
          matchedBy = "name";
        }
      }

      useStore.getState().setActiveParams({ ...picked });
      return {
        ok: true as const,
        matchedBy,
        scenarioName: picked.name,
      };
    },
  });

  useAssistantTool({
    type: "frontend",
    toolName: "update_explorer_scenario",
    description:
      "Patch the active Explorer scenario (main physics engine over geologic time). Only include keys to change. Example keys: radialMode, presentRadius, presentDayLength, angularMomentumMode, coreRadiusFraction, mantleDensity, massFixed, totalMass.",
    parameters: {
      type: "object",
      properties: {
        patch: {
          type: "object",
          description: "Partial scenario fields; unknown keys are ignored.",
          additionalProperties: true,
        },
      },
      required: ["patch"],
      additionalProperties: false,
    },
    async execute(args: { patch: Record<string, unknown> }) {
      const { activeParams, setActiveParams } = useStore.getState();
      const next = applyScenarioPatch(activeParams, args.patch ?? {});
      setActiveParams(next);
      return {
        ok: true as const,
        scenarioName: next.name,
        radialMode: next.radialMode,
        presentRadiusM: next.presentRadius,
        presentDayLengthH: next.presentDayLength,
      };
    },
  });

  useAssistantTool({
    type: "frontend",
    toolName: "physics_lab_set_params",
    description:
      "Patch Physics Lab parameters (first-principles tab, no geologic timeline). Keys include totalMassEarth, meanRadiusM (m), coreRadiusFraction, coreDensity, mantleDensity, dayLengthHours, conserveAngularMomentum, crustThicknessM, crustYieldMpa, massAnomalyFraction, anomalyColatitudeDeg.",
    parameters: {
      type: "object",
      properties: {
        patch: {
          type: "object",
          description: "Partial Physics Lab fields; unknown keys are ignored.",
          additionalProperties: true,
        },
      },
      required: ["patch"],
      additionalProperties: false,
    },
    async execute(args: { patch: Record<string, unknown> }) {
      const { physicsLabParams, setPhysicsLabParams } = useStore.getState();
      const next = applyPhysicsLabParamsPatch(physicsLabParams, args.patch ?? {});
      setPhysicsLabParams(next);
      return {
        ok: true as const,
        meanRadiusKm: next.meanRadiusM / 1000,
        dayLengthHours: next.dayLengthHours,
      };
    },
  });

  useAssistantTool({
    type: "frontend",
    toolName: "reset_physics_lab",
    description: "Reset Physics Lab sliders to the default Earth-like configuration.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    async execute() {
      useStore.getState().resetPhysicsLab();
      return { ok: true as const };
    },
  });

  return null;
}
