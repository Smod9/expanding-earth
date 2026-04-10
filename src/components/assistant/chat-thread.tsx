"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  MessagePartPrimitive,
} from "@assistant-ui/react";
import type { TextMessagePartProps } from "@assistant-ui/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
    </span>
  );
}

function TextPart({ text }: TextMessagePartProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-xs [&_h3]:font-semibold [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1.5 [&_code]:text-accent [&_code]:bg-surface-alt [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_strong]:text-foreground [&_a]:text-accent [&_table]:my-2 [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-surface-alt [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-1.5">
      <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{text}</Markdown>
      <MessagePartPrimitive.InProgress>
        <ThinkingDots />
      </MessagePartPrimitive.InProgress>
    </div>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end py-2">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent/20 px-4 py-2.5 text-sm text-foreground">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="py-2">
      <div className="max-w-[90%] text-sm text-foreground">
        <MessagePrimitive.Content
          components={{
            Text: TextPart,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function useVisualViewportBottomInset(active: boolean) {
  const [insetPx, setInsetPx] = useState(0);

  useEffect(() => {
    if (!active || typeof window === "undefined") {
      setInsetPx(0);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) {
      setInsetPx(0);
      return;
    }
    const update = () => {
      const layoutH = window.innerHeight;
      const visibleBottom = vv.height + vv.offsetTop;
      setInsetPx(Math.max(0, layoutH - visibleBottom));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);

  return insetPx;
}

function setTextareaValue(el: HTMLTextAreaElement, value: string) {
  const nativeSet = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set;
  nativeSet?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function SendButton() {
  return (
    <ComposerPrimitive.Send asChild>
      <button
        type="submit"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-background transition-colors hover:bg-accent/80 disabled:opacity-30"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 12V2M3 6l4-4 4 4" />
        </svg>
      </button>
    </ComposerPrimitive.Send>
  );
}

export function ChatThread({ actions }: { actions?: React.ReactNode }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const desktopInputRef = useRef<HTMLTextAreaElement>(null);
  const mobileInputRef = useRef<HTMLTextAreaElement>(null);
  const pendingChipTextRef = useRef<string | null>(null);
  const keyboardBottomInset = useVisualViewportBottomInset(composerOpen);

  const openComposer = useCallback(() => {
    setComposerOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    mobileInputRef.current?.blur();
  }, []);

  // Close composer after send — listen for the form submit
  const handleSend = useCallback(() => {
    setTimeout(() => setComposerOpen(false), 100);
  }, []);

  // After floating composer mounts, focus and apply chip text queued while closed
  useEffect(() => {
    if (!composerOpen) return;
    const input = mobileInputRef.current;
    if (!input) return;
    const pending = pendingChipTextRef.current;
    if (pending != null) {
      pendingChipTextRef.current = null;
      setTextareaValue(input, pending);
    }
    requestAnimationFrame(() => input.focus());
  }, [composerOpen]);

  // Lock page scroll behind the floating composer (mobile overlay)
  useEffect(() => {
    if (!composerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [composerOpen]);

  const applySuggestion = useCallback((q: string) => {
    if (typeof window === "undefined") return;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    if (narrow) {
      pendingChipTextRef.current = q;
      setComposerOpen(true);
      return;
    }
    const input = desktopInputRef.current;
    if (!input) return;
    setTextareaValue(input, q);
    input.focus();
  }, []);

  const floatingOverlay =
    composerOpen && typeof document !== "undefined" ? (
      <>
        <div
          className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm md:hidden"
          onClick={closeComposer}
          aria-hidden
        />
        <div
          className="fixed left-3 right-3 z-[110] md:hidden"
          style={{
            bottom: keyboardBottomInset,
            paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <ComposerPrimitive.Root
            className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-border bg-surface-alt px-3 py-2 shadow-lg shadow-black/20 dark:shadow-black/40 transition-colors focus-within:border-accent/40"
            onSubmit={handleSend}
          >
            <ComposerPrimitive.Input
              ref={mobileInputRef}
              placeholder="Ask about the model..."
              className="flex-1 resize-none border-none bg-transparent text-base leading-snug text-foreground outline-none placeholder:text-muted min-h-[40px] max-h-40 py-1"
              data-assistant-composer-input=""
              autoFocus
            />
            <SendButton />
          </ComposerPrimitive.Root>
        </div>
      </>
    ) : null;

  return (
    <>
    <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
          <span className="text-accent text-xs font-bold">E</span>
        </div>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
          Explorer Assistant
        </h3>
        {actions && <div className="flex items-center gap-0.5">{actions}</div>}
      </div>

      {/* Scrollable messages area */}
      <ThreadPrimitive.Viewport className="relative min-h-0 flex-1 overflow-y-auto px-4">
        <ThreadPrimitive.Empty>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
              <span className="text-accent text-lg font-bold">E</span>
            </div>
            <p className="text-sm font-medium">Explorer Assistant</p>
            <p className="max-w-[260px] text-xs text-muted leading-relaxed">
              Ask about the model, the physics, and the constraints — or tell me to change the scenario, time, tab, or Physics Lab settings. I can drive the UI from here.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-[280px] mt-2">
              {[
                "Why is the classical expansion hypothesis strained?",
                "What does the MoI factor tell us?",
                "Explain the Darwin-Radau approximation",
                "How does tidal braking affect day length?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  className="text-[10px] text-muted bg-surface-alt border border-border rounded-full px-2.5 py-1 hover:text-foreground hover:border-accent/30 transition-colors text-left"
                  onClick={() => applySuggestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />

        {/* Scroll-to-bottom button floats above the messages */}
        <div className="pointer-events-none sticky bottom-2 z-20 flex w-full justify-center">
          <ThreadPrimitive.ScrollToBottom asChild>
            <button
              type="button"
              className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-surface/95 px-3 py-1.5 text-[11px] text-muted shadow-md backdrop-blur-sm hover:bg-surface-alt disabled:pointer-events-none disabled:hidden transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2v8M2 6l4 4 4-4" />
              </svg>
              Scroll to bottom
            </button>
          </ThreadPrimitive.ScrollToBottom>
        </div>
      </ThreadPrimitive.Viewport>

      {/* Desktop composer — always inline */}
      <div className="hidden md:block shrink-0 border-t border-border bg-surface px-4 pt-3 pb-3">
        <ComposerPrimitive.Root className="flex items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 py-2 focus-within:border-accent/50 transition-colors">
          <ComposerPrimitive.Input
            ref={desktopInputRef}
            placeholder="Ask about the model..."
            className="flex-1 resize-none border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            autoFocus
          />
          <SendButton />
        </ComposerPrimitive.Root>
      </div>

      {/* Mobile: tap-to-open bar (CSS md:hidden — no JS media delay) */}
      {!composerOpen && (
        <div className="md:hidden shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={openComposer}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface-alt px-4 py-3 text-sm text-muted transition-colors"
          >
            <span className="flex-1 text-left">Ask about the model...</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent opacity-50">
              <path d="M7 12V2M3 6l4-4 4 4" />
            </svg>
          </button>
        </div>
      )}
    </ThreadPrimitive.Root>
    {floatingOverlay != null
      ? createPortal(floatingOverlay, document.body)
      : null}
    </>
  );
}
