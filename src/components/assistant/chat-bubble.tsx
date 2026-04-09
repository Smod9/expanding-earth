"use client";

import { useAssistantUI } from "./assistant-provider";
import { ChatThread } from "./chat-thread";

function IconExpand() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1h4v4M5 13H1V9" />
      <path d="M13 1L8.5 5.5M1 13l4.5-4.5" />
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

function IconRobot() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="5" />
      <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
      <rect x="4" y="5" width="16" height="13" rx="3" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <line x1="2" y1="10" x2="4" y2="10" />
      <line x1="20" y1="10" x2="22" y2="10" />
      <path d="M9.5 15.5c1 1 4 1 5 0" />
    </svg>
  );
}

const actionBtnClass =
  "rounded p-1 text-muted hover:text-foreground hover:bg-surface-alt transition-colors";

export function ChatBubble() {
  const { mode, setMode, ready } = useAssistantUI();

  if (!ready || mode === "pane") return null;

  return (
    <>
      {mode === "bubble" && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <ChatThread
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setMode("pane")}
                  className={actionBtnClass}
                  aria-label="Expand to side panel"
                >
                  <IconExpand />
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
        </div>
      )}

      <button
        type="button"
        onClick={() => setMode(mode === "hidden" ? "bubble" : "hidden")}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg transition-transform hover:scale-105 hover:bg-accent/90"
        aria-label="Toggle Explorer Assistant"
      >
        {mode === "bubble" ? (
          <IconClose />
        ) : (
          <IconRobot />
        )}
      </button>
    </>
  );
}
