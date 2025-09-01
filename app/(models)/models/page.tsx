'use client';

import { useRef } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ModelFilters } from '@/app/(models)/models/model-filters';
import { ModelListHeaders } from '@/app/(models)/models/components/model-list-header';
import { ModelListHeaderFilters } from '@/app/(models)/models/components/model-list-header-filters';
import { ModelResults } from '@/app/(models)/models/components/model-results';
import { ModelResultsCount } from '@/app/(models)/models/components/model-results-count';
import { ModelsProvider } from '@/app/(models)/models/models-store-context';

export default function HomePage() {
  return (
    <ModelsProvider>
      <ModelsPageContent />
    </ModelsProvider>
  );
}

function ModelsPageContent() {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[auto_1fr] ">
      <aside className="hidden md:block md:h-full min-h-0 w-full md:w-64 bg-sidebar">
        <ScrollArea className="h-full">
          <ModelFilters className="p-4 overflow-y-auto" />
        </ScrollArea>
      </aside>

      <main className="min-h-0 md:h-full">
        <ScrollArea ref={viewportRef} className="h-full">
          <div className="p-4 lg:p-6 max-w-4xl mx-auto">
            <div className="mb-4 flex flex-col gap-2">
              <ModelListHeaders />
              <ModelListHeaderFilters />
              <ModelResultsCount />
            </div>

            <ModelResults scrollParentRef={viewportRef} />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
