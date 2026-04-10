import {
  streamText,
  convertToModelMessages,
  tool,
  jsonSchema,
} from "ai";
import {
  gateway,
  GatewayError,
  GatewayModelNotFoundError,
} from "@ai-sdk/gateway";
import type { JSONSchema7 } from "json-schema";

export const runtime = "nodejs";
export const maxDuration = 120;

type ClientToolPayload = Record<
  string,
  { description?: string; parameters: JSONSchema7 }
>;

/** Rich logs for Vercel Runtime (Observability → Logs). Never log prompts. */
function logChatError(scope: string, error: unknown) {
  if (GatewayError.isInstance(error)) {
    const base = {
      scope,
      name: error.name,
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      generationId: error.generationId,
    };
    if (GatewayModelNotFoundError.isInstance(error)) {
      console.error("[api/chat]", { ...base, modelId: error.modelId });
    } else {
      console.error("[api/chat]", { ...base, cause: error.cause });
    }
    return;
  }
  if (error instanceof Error) {
    console.error("[api/chat]", {
      scope,
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return;
  }
  console.error("[api/chat]", { scope, error });
}

function toolsFromClientPayload(
  clientTools: ClientToolPayload | undefined,
): Record<string, ReturnType<typeof tool>> | undefined {
  if (!clientTools || Object.keys(clientTools).length === 0) return undefined;
  const out: Record<string, ReturnType<typeof tool>> = {};
  for (const [name, def] of Object.entries(clientTools)) {
    if (!def?.parameters) continue;
    out[name] = tool({
      description: def.description,
      inputSchema: jsonSchema(def.parameters),
    });
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: unknown;
      pageContext?: Record<string, unknown>;
      tools?: ClientToolPayload;
      system?: string;
    };

    const { messages, pageContext, tools: clientTools, system: clientSystem } =
      body;

    const modelId =
      process.env.EARTH_CHAT_MODEL?.trim() || "anthropic/claude-opus-4.6";

    console.info("[api/chat] request", {
      modelId,
      earthChatModelEnv: Boolean(process.env.EARTH_CHAT_MODEL?.trim()),
      auth: {
        aiGatewayApiKey: Boolean(process.env.AI_GATEWAY_API_KEY),
        vercelOidc: Boolean(process.env.VERCEL_OIDC_TOKEN),
      },
      messageCount: Array.isArray(messages) ? messages.length : -1,
      toolNames: clientTools ? Object.keys(clientTools) : [],
    });

    let contextBlock = "";
    if (pageContext) {
      const pc = pageContext as Record<string, string | number | undefined>;
      contextBlock = `

## Current App State
- Active tab: ${pc.activeTab ?? "unknown"}
- Active scenario: ${pc.scenarioName ?? "unknown"}
- Scenario description: ${pc.scenarioDescription ?? ""}
- Time selected: ${pc.timeMya ?? 0} Ma (millions of years ago)
- Radial mode: ${pc.radialMode ?? "none"}
- Current radius: ${pc.radius ?? "N/A"} km
- Surface gravity: ${pc.surfaceGravity ?? "N/A"} m/s²
- Mean density: ${pc.meanDensity ?? "N/A"} kg/m³
- Day length: ${pc.dayLength ?? "N/A"} hours
- Expansion rate: ${pc.expansionRate ?? "N/A"} mm/yr
- Tectonic regime: ${pc.tectonicRegime ?? "N/A"}
- MoI factor: ${pc.moiFactor ?? "N/A"}
- Oblateness: ${pc.oblateness ?? "N/A"}
- Pole drift rate: ${pc.poleDriftRate ?? "N/A"} °/Myr
- Physics Lab (if using that tab): mass = ${pc.physicsLabMassEarth ?? "N/A"} M⊕, radius = ${pc.physicsLabRadiusKm ?? "N/A"} km, day = ${pc.physicsLabDayLengthH ?? "N/A"} h, crust = ${pc.physicsLabCrustKm ?? "N/A"} km

### Constraint Assessment
${pc.constraintSummary ?? "Not evaluated"}`;
    }

    const toolsBlock = clientTools
      ? `

## App control tools
Frontend tools are available: you can change the active tab, geologic time, load a seed scenario, patch Explorer scenario parameters, and patch or reset Physics Lab parameters. When the user asks to try a configuration, **call the appropriate tools** instead of only describing hypothetical slider moves. After tools run, briefly confirm what changed.`
      : "";

    let systemPrompt = `You are the Planetary Dynamics Explorer assistant — an intellectually honest scientific discussion partner embedded in an interactive model-exploration tool.

## Your Role
You help users understand and explore the hypothesis that plate tectonics, while extremely successful, may be one layer of a larger planetary dynamics system. You are knowledgeable about:
- Plate tectonics, mantle convection, and Earth's internal structure
- The expanding Earth hypothesis (Carey, Hilgenberg, and modern variants)
- Geodetic, paleomagnetic, and geological constraints on planetary evolution
- Rotational dynamics, hydrostatic equilibrium, and true polar wander
- The physics engine in this app: how it computes radius, density, gravity, rotation, oblateness, moment of inertia, and tectonic regime

## About This App
The Planetary Dynamics Explorer lets users:
1. Choose different radial evolution scenarios (no expansion, linear, exponential, episodic, custom)
2. Adjust physical parameters (mass, layering, rotation, relaxation, pole drift)
3. See how planetary state evolves over 4.5 billion years
4. Compare model predictions against empirical constraints
5. Compare multiple scenario interpretations side by side
6. Use the **Physics Lab** tab for first-principles rotating-body mechanics (no geologic timeline)

The app has 5 seed scenarios:
- **Standard — No Expansion**: Mainstream null hypothesis. Constant radius, tidal braking.
- **Tiny Present-Day Expansion**: Upper bound of geodetic tolerance (~0.1 mm/yr). Within measurement uncertainty.
- **Classical Expansion Hypothesis**: ~45% historical growth. In STRONG tension with multiple constraints.
- **Episodic Pulse Expansion**: Pulses tied loosely to geological events. Speculative.
- **Hybrid — Plate Tectonics as Surface Regime**: Very small radial change, emphasis on regime transitions. The "PT is correct AND part of a larger story" idea.

## Epistemic Standards
- Clearly distinguish between observations, inferences, model outputs, and speculation
- Never present fringe ideas as established fact
- Acknowledge when the mainstream view is strongly supported
- Point out where alternative models create tension with evidence
- Be genuinely curious and exploratory — not dismissive, not promotional
- If the user's current scenario conflicts with evidence, explain why honestly
- Use the current app state (provided below) to give contextual answers
${toolsBlock}

## How to answer (default: concise)
- **Keep replies short by default:** lead with the direct answer in one to three short paragraphs, or a small set of bullets. No long intros, filler, or repeated caveats.
- **Go longer only when asked** (e.g. "explain in detail", "walk me through", "tutorial") or when the question truly needs a long derivation or exhaustive comparison.
- Use markdown for readability; prefer tight structure over volume.

## Tone
Smart, skeptical, exploratory, concise. Like talking to a knowledgeable colleague who takes the question seriously but won't handwave past problems.
${contextBlock}`;

    if (typeof clientSystem === "string" && clientSystem.trim()) {
      systemPrompt += `\n\n## Additional instructions\n${clientSystem.trim()}`;
    }

    let modelMessages: Awaited<
      ReturnType<typeof convertToModelMessages>
    >;
    try {
      modelMessages = await convertToModelMessages(
        messages as Parameters<typeof convertToModelMessages>[0],
      );
    } catch (convErr) {
      logChatError("convertToModelMessages", convErr);
      throw convErr;
    }

    console.info("[api/chat] converted messages", {
      modelMessageCount: modelMessages.length,
    });

    const toolSet = toolsFromClientPayload(clientTools);

    const result = streamText({
      model: gateway(modelId),
      system: systemPrompt,
      messages: modelMessages,
      ...(toolSet && Object.keys(toolSet).length > 0 ? { tools: toolSet } : {}),
      providerOptions: {
        gateway: {
          models: ["openai/gpt-5.4"],
        },
      },
      onError: ({ error }) => {
        logChatError("streamText", error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        logChatError("toUIMessageStreamResponse", error);
        return "Temporary error from the AI service. Please try again.";
      },
    });
  } catch (err) {
    logChatError("POST catch", err);
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Chat request could not be processed",
      },
      { status: 500 },
    );
  }
}
