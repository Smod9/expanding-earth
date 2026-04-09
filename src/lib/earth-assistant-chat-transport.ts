/**
 * Fixed copy of @assistant-ui/react-ai-sdk's AssistantChatTransport.
 *
 * Upstream uses `this.runtime?.thread.getModelContext()` which throws when
 * `runtime` is still undefined: `(undefined?.thread)` is `undefined`, then
 * `.getModelContext()` is evaluated and crashes. Same pattern for `threads`.
 *
 * @see https://github.com/assistant-ui/assistant-ui (AssistantChatTransport.js)
 */
import { DefaultChatTransport, type UIMessage } from "ai";
import { toToolsJSONSchema } from "assistant-stream";
import type { AssistantRuntime } from "@assistant-ui/core";

type InitOptions = ConstructorParameters<typeof DefaultChatTransport<UIMessage>>[0];

export class EarthAssistantChatTransport extends DefaultChatTransport<UIMessage> {
  runtime: AssistantRuntime | undefined;

  constructor(initOptions: InitOptions) {
    super({
      ...initOptions,
      prepareSendMessagesRequest: async (options) => {
        const context = this.runtime?.thread?.getModelContext?.();
        const id =
          (await this.runtime?.threads?.mainItem?.initialize?.())?.remoteId ??
          options.id;
        const optionsEx = {
          ...options,
          body: {
            callSettings: context?.callSettings,
            system: context?.system,
            config: context?.config,
            tools: toToolsJSONSchema(context?.tools ?? {}),
            ...options?.body,
          },
        };
        const preparedRequest =
          await initOptions?.prepareSendMessagesRequest?.(optionsEx);
        return {
          ...preparedRequest,
          body: preparedRequest?.body ?? {
            ...optionsEx.body,
            id,
            messages: options.messages,
            trigger: options.trigger,
            messageId: options.messageId,
            metadata: options.requestMetadata,
          },
        };
      },
    });
  }

  setRuntime(runtime: AssistantRuntime) {
    this.runtime = runtime;
  }
}
