'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ModelCard } from '@/app/(models)/models/gateway-model-card';
import { cn } from '@/lib/utils';
import { useModels } from '@/app/(models)/models/models-store-context';

export function ModelCardList({
  scrollParentRef,
  className,
  estimateItemSize = 240,
}: {
  scrollParentRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  estimateItemSize?: number;
}) {
  const models = useModels((s) => s.resultModels());
  const virtualizer = useVirtualizer({
    count: models.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => estimateItemSize,
  });

  const items = virtualizer.getVirtualItems();
  // console.debug('virtual items', items.length);
  return (
    <div
      className={cn('relative', className)}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {items.map((item) => {
        const model = models[item.index];
        if (!model) return null;
        return (
          <div
            key={item.key}
            data-index={item.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${item.size}px`,
              transform: `translateY(${item.start}px)`,
            }}
          >
            <ModelCard model={model} />
          </div>
        );
      })}
    </div>
  );
}
