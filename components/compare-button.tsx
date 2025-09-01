'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from 'react';

export function CompareButton({
  modelId,
  children,
  ...props
}: { modelId: string } & ComponentProps<typeof Button>) {
  return (
    <Button asChild {...props}>
      <Link href={`/compare/${modelId}`}>{children ?? 'Compare'}</Link>
    </Button>
  );
}
