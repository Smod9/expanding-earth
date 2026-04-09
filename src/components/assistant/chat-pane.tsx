"use client";

import { useAssistantUI } from "./assistant-provider";
import { ChatThread } from "./chat-thread";

function IconCollapse() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10H1v3M10 4h3V1" />
      <path d="M1 13l4.5-4.5M13 1L8.5 5.5" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 1l12 12M13 1L1 13" />
    </svg>
  );
}

const actionBtnClass =
  "rounded p-1 text-muted hover:text-foreground hover:bg-surface-alt transition-colors";

export function ChatPane() {
  const { mode, setMode, ready } = useAssistantUI();

  if (!ready || mode !== "pane") return null;

  return (
    <aside className="flex h-full w-[400px] shrink-0 flex-col border-l border-border bg-surface">
      <ChatThread
        actions={
          <>
            <button
              type="button"
              onClick={() => setMode("bubble")}
              className={actionBtnClass}
              aria-label="Collapse to floating window"
            >
              <IconCollapse />
            </button>
            <button
              type="button"
              onClick={() => setMode("hidden")}
              className={actionBtnClass}
              aria-label="Close chat"
            >
              <IconClose />
            </button>
          </>
        }
      />
    </aside>
  );
}
