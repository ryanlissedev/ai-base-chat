'use client';

import { useMemo } from 'react';
import Link from 'next/link';
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
  const href = useMemo(() => {
    if (!modelId) return '/';
    return `/?modelId=${encodeURIComponent(modelId)}`;
  }, [modelId]);

  return (
    <Button asChild className={className}>
      <Link href={href}>{children ?? 'Chat'}</Link>
    </Button>
  );
}
