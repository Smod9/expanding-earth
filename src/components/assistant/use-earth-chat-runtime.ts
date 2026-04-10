"use client";

/**
 * Fork of @assistant-ui/react-ai-sdk useChatRuntime with two fixes:
 * 1. Call setRuntime on any transport that exposes it (not only AssistantChatTransport),
 *    so EarthAssistantChatTransport receives the assistant runtime.
 * 2. Default transport uses EarthAssistantChatTransport (safe optional chaining).
 */
import { useChat } from "@ai-sdk/react";
import { safeValidateUIMessages, type ChatTransport, type UIMessage } from "ai";
import {
  useCloudThreadListAdapter,
  useRemoteThreadListRuntime,
} from "@assistant-ui/core/react";
import type { AssistantRuntime } from "@assistant-ui/core";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import type { UseChatRuntimeOptions } from "@assistant-ui/react-ai-sdk";
import { useAuiState } from "@assistant-ui/store";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { EarthAssistantChatTransport } from "@/lib/earth-assistant-chat-transport";
import {
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
} from "@/lib/chat-history";

function useDynamicChatTransport(transport: ChatTransport<UIMessage>) {
  const transportRef = useRef(transport);
  useEffect(() => {
    transportRef.current = transport;
  });
  const dynamicTransport = useMemo(
    () =>
      new Proxy(transportRef.current, {
        get(_, prop) {
          const res = transportRef.current[prop as keyof ChatTransport<UIMessage>];
          return typeof res === "function"
            ? (res as (...a: unknown[]) => unknown).bind(transportRef.current)
            : res;
        },
      }),
    [],
  );
  return dynamicTransport as ChatTransport<UIMessage>;
}

function useChatThreadRuntime(
  options: UseChatRuntimeOptions | undefined,
): AssistantRuntime {
  const { adapters, transport: transportOptions, toCreateMessage, ...chatOptions } =
    options ?? {};
  const transport = useDynamicChatTransport(
    transportOptions ?? new EarthAssistantChatTransport({ api: "/api/chat" }),
  );
  const id = useAuiState((s) => s.threadListItem.id);
  const initialMessages = useMemo(() => loadChatHistory() as UIMessage[], [id]);
  const chat = useChat({
    ...chatOptions,
    id,
    transport,
    messages: initialMessages.length > 0 ? initialMessages : undefined,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = loadChatHistory();
      if (raw.length === 0) return;
      const result = await safeValidateUIMessages({ messages: raw });
      if (cancelled) return;
      if (!result.success) {
        clearChatHistory();
        chat.setMessages([]);
        return;
      }
      chat.setMessages(result.data);
      saveChatHistory(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const prevLenRef = useRef(initialMessages.length);
  useEffect(() => {
    prevLenRef.current = initialMessages.length;
  }, [id, initialMessages.length]);

  const persistMessages = useCallback(() => {
    if (chat.messages.length !== prevLenRef.current) {
      prevLenRef.current = chat.messages.length;
      saveChatHistory(chat.messages);
    }
  }, [chat.messages]);

  useEffect(() => {
    persistMessages();
  }, [persistMessages]);

  const runtime = useAISDKRuntime(chat, {
    adapters,
    ...(toCreateMessage && { toCreateMessage }),
  });

  const t = transport as { setRuntime?: (r: AssistantRuntime) => void };
  if (typeof t.setRuntime === "function") {
    t.setRuntime(runtime);
  }

  return runtime;
}

export function useEarthChatRuntime(
  { cloud, ...options }: UseChatRuntimeOptions = {},
): AssistantRuntime {
  const cloudAdapter = useCloudThreadListAdapter({ cloud });
  return useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      return useChatThreadRuntime(options);
    },
    adapter: cloudAdapter,
    allowNesting: true,
  });
}
