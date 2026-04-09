'use client';

import { AppShell } from '@/components/AppShell';
import { AssistantProvider } from '@/components/assistant/assistant-provider';
import { ChatBubble } from '@/components/assistant/chat-bubble';

export default function Home() {
  return (
    <AssistantProvider>
      <AppShell />
      <ChatBubble />
    </AssistantProvider>
  );
}
