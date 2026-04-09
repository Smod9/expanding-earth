"use client";

import { useState } from "react";
import { ChatThread } from "./chat-thread";

export function ChatBubble() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat popover */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <ChatThread onClose={() => setOpen(false)} />
        </div>
      )}

      {/* FAB toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg transition-transform hover:scale-105 hover:bg-accent/90"
        aria-label="Toggle Explorer Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h14M3 10h14M3 15h8" />
          </svg>
        )}
      </button>
    </>
  );
}
