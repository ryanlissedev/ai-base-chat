'use client';

import type { Attachment } from '@/lib/ai/types';
import type { ModelId } from '@/lib/models/model-id';
import { useLastUsageUntilMessageId } from '@/lib/stores/chat-store-context';
import { PromptInputContextBar } from '@/components/ai-elements/prompt-input';
import { AttachmentList } from '@/components/attachment-list';
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from '@/components/ai-elements/context';

import type { ModelId as TokenLensModelId } from 'tokenlens';
import { getContextWindow } from 'tokenlens';
import type { LanguageModelUsage } from 'ai';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export function ContextBar({
  attachments,
  uploadQueue,
  onRemove,
  onImageClick,
  selectedModelId,
  parentMessageId,
  className,
}: {
  attachments: Attachment[];
  uploadQueue: string[];
  onRemove: (attachment: Attachment) => void;
  onImageClick: (url: string, name?: string) => void;
  selectedModelId: ModelId;
  parentMessageId: string | null;
  className?: string;
}) {
  const usage = useLastUsageUntilMessageId(parentMessageId);

  const hasBarContent =
    attachments.length > 0 || uploadQueue.length > 0 || usage;

  return (
    <motion.div
      className={cn(className)}
      animate={{
        height: hasBarContent ? 'auto' : 0,
        opacity: hasBarContent ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      <PromptInputContextBar className="border-b w-full">
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <AttachmentList
            attachments={attachments}
            uploadQueue={uploadQueue}
            onRemove={onRemove}
            onImageClick={onImageClick}
            testId="attachments-preview"
            className="px-3 py-2 grow"
          />
        )}
        {usage && (
          <div className="ml-auto">
            <ContextUsage usage={usage} selectedModelId={selectedModelId} />
          </div>
        )}
      </PromptInputContextBar>
    </motion.div>
  );
}

function ContextUsage({
  usage,
  selectedModelId,
}: { usage: LanguageModelUsage; selectedModelId: ModelId }) {
  const contextMax = useMemo(() => {
    try {
      const cw = getContextWindow(selectedModelId as unknown as string);
      return cw.combinedMax ?? cw.inputMax ?? 0;
    } catch {
      return 0;
    }
  }, [selectedModelId]);

  const usedTokens = useMemo(() => {
    if (!usage) return 0;
    const input = ('inputTokens' in usage ? usage.inputTokens : 0) ?? 0;
    const cached = ('cachedInputTokens' in usage ? usage.cachedInputTokens : 0) ?? 0;
    return input + cached;
  }, [usage]);

  return (
    <Context
      usedTokens={usedTokens}
      maxTokens={contextMax}
      usage={usage as LanguageModelUsage | undefined}
      modelId={selectedModelId.split('/').join(':') as TokenLensModelId}
    >
      <ContextTrigger />
      <ContextContent align="end">
        <ContextContentHeader />
        <ContextContentBody className="space-y-2">
          <ContextInputUsage />
          <ContextOutputUsage />
          <ContextReasoningUsage />
          <ContextCacheUsage />
        </ContextContentBody>
        <ContextContentFooter />
      </ContextContent>
    </Context>
  );
}
