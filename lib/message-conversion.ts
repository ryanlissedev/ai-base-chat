import type { UIChat } from '@/lib/types/uiChat';
import type { DBMessage, Chat } from '@/lib/db/schema';
import type { ChatMessage, UiToolName } from './ai/types';
import type { ModelId } from './models/model-id';

// Helper functions for type conversion
export function dbChatToUIChat(chat: Chat): UIChat {
  return {
    id: chat.id,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    title: chat.title,
    visibility: chat.visibility,
    userId: chat.userId,
    isPinned: chat.isPinned,
  };
}

export function dbMessageToChatMessage(message: DBMessage): ChatMessage {
  return {
    id: message.id,
    parts: message.parts as ChatMessage['parts'],
    role: message.role as ChatMessage['role'],
    metadata: {
      createdAt: message.createdAt,
      isPartial: message.isPartial,
      parentMessageId: message.parentMessageId,
      selectedModel: (message.selectedModel as ModelId) || ('' as ModelId),
      selectedTool: (message.selectedTool as UiToolName | null) || undefined,
    },
  };
}

export function chatMessageToDbMessage(
  message: ChatMessage,
  chatId: string,
): DBMessage {
  const metadata = message.metadata || {};
  const parentMessageId = metadata.parentMessageId || null;
  const isPartial = metadata.isPartial || false;
  const selectedModel = metadata.selectedModel;

  return {
    id: message.id,
    chatId: chatId,
    role: message.role,
    parts: message.parts,
    attachments: [],
    lastContext: metadata.usage || null,
    createdAt: metadata.createdAt || new Date(),
    annotations: [],
    isPartial: isPartial,
    parentMessageId: parentMessageId,
    selectedModel: selectedModel,
    selectedTool: metadata.selectedTool || null,
  };
}
