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
            {/* antenna */}
            <line x1="12" y1="2" x2="12" y2="5" />
            <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
            {/* head */}
            <rect x="4" y="5" width="16" height="13" rx="3" />
            {/* eyes */}
            <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
            {/* ears */}
            <line x1="2" y1="10" x2="4" y2="10" />
            <line x1="20" y1="10" x2="22" y2="10" />
            {/* mouth */}
            <path d="M9.5 15.5c1 1 4 1 5 0" />
          </svg>
        )}
      </button>
    </>
  );
}
