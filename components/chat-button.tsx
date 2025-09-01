'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { ModelId } from '@/lib/models/model-id';

export function ChatButton({
  modelId,
  className,
  children,
}: {
  modelId?: ModelId | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  const href = useMemo(() => {
    if (!modelId) return '/';
    const url = new URL('/', window.location.origin);
    url.searchParams.set('modelId', modelId);
    return url.pathname + url.search;
  }, [modelId]);

  return (
    <Button
      className={className}
      onClick={() => router.push(href)}
      type="button"
    >
      {children ?? 'Chat'}
    </Button>
  );
}
