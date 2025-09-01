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
  overscan = 8,
}: {
  scrollParentRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  estimateItemSize?: number;
  overscan?: number;
}) {
  const models = useModels((s) => s.resultModels());
  const virtualizer = useVirtualizer({
    count: models.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => estimateItemSize,
    overscan,
    getItemKey: (index) => models[index]?.id ?? String(index),
    initialRect: { width: 0, height: 600 },
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
            key={model.id}
            ref={virtualizer.measureElement}
            data-index={item.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${item.start}px)`,
            }}
          >
            <div className="pb-4">
              <ModelCard model={model} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
