'use client';

import * as React from 'react';
import { useModels } from '@/app/(models)/models/models-store-context';
import { PureEmptyState } from '@/app/(models)/models/components/empty-state';
import { ModelCardList } from '@/app/(models)/models/components/model-card-list';

export function ModelResults({
  scrollParentRef,
  className,
}: {
  scrollParentRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  const count = useModels((s) => s.resultModels().length);

  if (count === 0) {
    return <PureEmptyState onClearAll={() => {}} />;
  }

  return (
    <ModelCardList scrollParentRef={scrollParentRef} className={className} />
  );
}
