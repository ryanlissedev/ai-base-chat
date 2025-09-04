'use client';
import { Container } from '@/components/container';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { ModelResultsHeader } from './components/model-results-header';
import { ModelCard } from './gateway-model-card';
import { useModels } from './models-store-context';
import { PureEmptyState } from './components/empty-state';

export function ModelsResults() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const models = useModels((s) => s.resultModels());
  const rowVirtualizer = useVirtualizer({
    count: models.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 240,
    overscan: 5,
  });

  return (
    <div
      ref={viewportRef}
      className="List"
      style={{
        height: `100%`,
        width: `100%`,
        overflow: 'auto',
        contain: 'strict',
      }}
    >
      <Container className="p-4 lg:p-6 h-full">
        <ModelResultsHeader />

        {models.length === 0 && <PureEmptyState />}

        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px)`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const model = models[virtualRow.index];
              if (!model) return null;
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className={virtualRow.index === 0 ? 'mb-2' : 'my-2'}
                >
                  <ModelCard model={model} />
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
