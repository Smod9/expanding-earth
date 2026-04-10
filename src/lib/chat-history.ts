const STORAGE_KEY = "earth-assistant-history";
const STORAGE_VERSION = 2;
const MAX_STORED_BYTES = 256 * 1024; // 256 KB cap

type StoredEnvelope = { v: number; messages: unknown[] };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** Normalize a single part so half-streamed / corrupt tool states do not brick the API. */
function normalizePart(part: unknown): unknown | undefined {
  if (!isRecord(part)) return undefined;
  const type = part.type;
  if (typeof type !== "string") return undefined;

  if (type === "text") {
    if (typeof part.text !== "string") return undefined;
    const state = part.state === "streaming" ? "done" : part.state;
    return { ...part, type: "text", text: part.text, ...(state ? { state } : {}) };
  }

  if (type === "reasoning") {
    if (typeof part.text !== "string") return undefined;
    const state = part.state === "streaming" ? "done" : part.state;
    return { ...part, type: "reasoning", text: part.text, ...(state ? { state } : {}) };
  }

  if (type === "dynamic-tool") {
    if (typeof part.toolCallId !== "string") return undefined;
    if (typeof part.toolName !== "string") return undefined;
    if (part.state === "input-streaming") return undefined;
    return part;
  }

  if (type.startsWith("tool-")) {
    if (typeof part.toolCallId !== "string") return undefined;
    if (part.state === "input-streaming") return undefined;
    return part;
  }

  // Known non-tool parts (keep as-is for SDK validation)
  if (
    type === "source-url" ||
    type === "source-document" ||
    type === "file" ||
    type === "step-start" ||
    type.startsWith("data-")
  ) {
    return part;
  }

  return part;
}

function normalizeMessage(msg: unknown): unknown | undefined {
  if (!isRecord(msg)) return undefined;
  if (typeof msg.id !== "string" || msg.id.length === 0) return undefined;
  const role = msg.role;
  if (role !== "user" && role !== "assistant" && role !== "system") return undefined;
  if (!Array.isArray(msg.parts)) return undefined;

  const parts: unknown[] = [];
  for (const p of msg.parts) {
    const n = normalizePart(p);
    if (n === undefined) return undefined;
    parts.push(n);
  }
  if (parts.length === 0) return undefined;

  const out: Record<string, unknown> = { id: msg.id, role, parts };
  if (msg.metadata !== undefined) out.metadata = msg.metadata;
  return out;
}

function parseStored(raw: string): unknown[] | null {
  const parsed: unknown = JSON.parse(raw);
  if (isRecord(parsed) && typeof parsed.v === "number" && Array.isArray(parsed.messages)) {
    return parsed.messages;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return null;
}

function normalizeMessagesArray(arr: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const m of arr) {
    const n = normalizeMessage(m);
    if (n === undefined) {
      return [];
    }
    out.push(n);
  }
  return out;
}

export function loadChatHistory(): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = parseStored(raw);
    if (arr === null) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    const normalized = normalizeMessagesArray(arr);
    if (normalized.length === 0 && arr.length > 0) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return normalized;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return [];
  }
}

export function saveChatHistory(messages: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    let toStore = messages;
    const envelope = (): StoredEnvelope => ({ v: STORAGE_VERSION, messages: toStore });
    let json = JSON.stringify(envelope());

    while (json.length > MAX_STORED_BYTES && toStore.length > 1) {
      toStore = toStore.slice(1);
      json = JSON.stringify(envelope());
    }

    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function clearChatHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
