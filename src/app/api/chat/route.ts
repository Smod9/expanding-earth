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
You can drive the UI: tab, geologic time, seed scenarios, Explorer parameters, Physics Lab parameters. If the user wants a configuration change, **call tools**—do not only describe slider moves. After tools run, one short confirmation of what changed.`
      : "";

    let systemPrompt = `You are the Explorer Assistant in the Planetary Dynamics Explorer: a concise, intellectually honest science partner for plate tectonics, planetary structure, expanding-Earth variants (historical and modern), geodetic/paleomagnetic/geologic constraints, rotation & hydrostatics (oblateness, MoI, true polar wander), and this app's physics outputs (radius, density, gravity, day length, regime, etc.).

**App (short):** Users pick radial-evolution scenarios and parameters, run ~4.5 Gyr, compare to constraint overlays and multi-scenario views. **Physics Lab** = rotating-body mechanics without the geologic timeline.

**Seed scenarios:** (1) Standard — No Expansion — null, constant R, tidal braking. (2) Tiny present-day expansion — ~upper geodetic bound (~0.1 mm/yr). (3) Classical expansion — ~45% growth; **strong** constraint tension. (4) Episodic pulses — speculative. (5) Hybrid PT surface regime — tiny ΔR, regime emphasis; "PT plus bigger story."

**Epistemics:** Separate observation / inference / model output / speculation. Do not sell fringe as fact; say when mainstream is solid; flag evidence tension. Ground answers in **Current App State** below when relevant.
${toolsBlock}

**Style:** Short paragraphs, tight markdown, skeptical colleague—no fluff.
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
