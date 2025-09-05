'use client';
import { ChatSystem } from '@/components/chat-system';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { ModelId } from '@/lib/models/model-id';

export function ChatHome({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const overrideModelId = useMemo(() => {
    const value = searchParams.get('modelId');
    return (value as ModelId) || undefined;
  }, [searchParams]);
  return (
    <>
      <ChatSystem
        id={id}
        initialMessages={[]}
        isReadonly={false}
        overrideModelId={overrideModelId}
      />
    </>
  );
}
