const STORAGE_KEY = "earth-assistant-history";
const MAX_STORED_BYTES = 256 * 1024; // 256 KB cap

export function loadChatHistory(): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    let toStore = messages;
    let json = JSON.stringify(toStore);

    // If over budget, trim oldest messages until it fits
    while (json.length > MAX_STORED_BYTES && toStore.length > 1) {
      toStore = toStore.slice(1);
      json = JSON.stringify(toStore);
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
