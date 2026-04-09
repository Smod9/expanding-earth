"use client";

import { useState } from "react";
import { ChatThread } from "./chat-thread";

export function ChatBubble() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <ChatThread onClose={() => setOpen(false)} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg transition-transform hover:scale-105 hover:bg-accent/90"
        aria-label="Toggle Explorer Assistant"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3l12 12M15 3L3 15" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.55 1.43 4.83 3.67 6.35L4.5 21l4.3-2.15c1.02.27 2.1.42 3.2.42 5.52 0 10-3.82 10-8.5S17.52 2 12 2z" />
            <circle cx="8.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="10.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>
    </>
  );
}
