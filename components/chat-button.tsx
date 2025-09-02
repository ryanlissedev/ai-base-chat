'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ModelId } from '@/lib/models/model-id';
import { cn } from '@/lib/utils';

export function ChatButton({
  modelId,
  className,
  children,
  variant = 'default',
  disabled = false,
}: {
  modelId?: ModelId | null;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline';
  disabled?: boolean;
}) {
  const href = useMemo(() => {
    if (!modelId) return '';
    return `/?modelId=${encodeURIComponent(modelId)}`;
  }, [modelId]);

  return (
    <Button
      asChild
      className={cn('flex flex-row', className)}
      variant={variant}
      disabled={!modelId}
    >
      <Link href={href}>{children ?? 'Chat'}</Link>
    </Button>
  );
}
