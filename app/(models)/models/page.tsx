'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ModelFilters } from '@/app/(models)/models/model-filters';
import { ModelsProvider } from '@/app/(models)/models/models-store-context';
import { ModelsResults } from './models-results';

export default function HomePage() {
  return (
    <ModelsProvider>
      <ModelsPageContent />
    </ModelsProvider>
  );
}

function ModelsPageContent() {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[auto_1fr] ">
      <aside className="hidden md:block md:h-full min-h-0 w-full md:w-64 bg-sidebar">
        <ScrollArea className="h-full">
          <ModelFilters className="p-4 overflow-y-auto" />
        </ScrollArea>
      </aside>

      <main className="min-h-0 h-full">
        <ModelsResults />
      </main>
    </div>
  );
}
