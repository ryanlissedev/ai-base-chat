'use client';
import { getDefaultThread } from '@/lib/thread-utils';
import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/react';
import type { UiToolName, ChatMessage } from '@/lib/ai/types';
import { ChatSystem } from '@/components/chat-system';

// moved to components/chat-system

export function ChatPage({ id }: { id: string }) {
  const trpc = useTRPC();

  const { data: chat } = useSuspenseQuery(
    trpc.chat.getChatById.queryOptions({ chatId: id || '' }),
  );
  const { data: messages } = useSuspenseQuery(
    trpc.chat.getChatMessages.queryOptions({ chatId: id || '' }),
  ) as { data: ChatMessage[] };

  const initialThreadMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) return [];
    return getDefaultThread(
      messages.map((msg) => ({ ...msg, id: msg.id.toString() })),
    );
  }, [messages]);

  const initialTool = useMemo<UiToolName | null>(() => {
    const assistantMessages = messages && Array.isArray(messages) ? messages.filter(
      (m) => m.role === 'assistant',
    ) : [];
    const lastAssistantMessage = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
    if (!lastAssistantMessage || !Array.isArray(lastAssistantMessage.parts))
      return null;
    for (const part of lastAssistantMessage.parts) {
      if (
        part?.type === 'tool-deepResearch' &&
        part?.state === 'output-available' &&
        part?.output?.format === 'clarifying_questions'
      ) {
        return 'deepResearch';
      }
    }
    return null;
  }, [messages]);

  if (!id) {
    return notFound();
  }

  if (!chat) {
    return notFound();
  }

  return (
    <>
      <ChatSystem
        id={chat.id}
        initialMessages={initialThreadMessages}
        isReadonly={false}
        initialTool={initialTool}
      />
    </>
  );
}
