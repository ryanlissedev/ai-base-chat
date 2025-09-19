import { getAllMessagesByChatId } from '@/lib/db/queries';
import { dbMessageToChatMessage } from '@/lib/message-conversion';
import { buildThreadFromLeaf } from '@/lib/thread-utils';
import type { ChatMessage } from '@/lib/ai/types';

export async function getThreadUpToMessageId(
  chatId: string,
  messageId: string | null,
): Promise<ChatMessage[]> {
  if (!messageId) {
    return [];
  }

  const messages = (await getAllMessagesByChatId({ chatId })).map(
    dbMessageToChatMessage,
  );

  return buildThreadFromLeaf(messages, messageId);
}
