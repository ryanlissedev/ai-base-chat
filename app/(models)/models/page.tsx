'use client';

import { useDeferredValue, useMemo } from 'react';
import {
  chatModels as allChatModels,
  type ModelDefinition,
} from '@/lib/ai/all-models';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ModelFilters } from '@/app/(models)/models/model-filters';
import { PureModelListHeader } from '@/app/(models)/models/components/model-list-header';
import { PureEmptyState } from '@/app/(models)/models/components/empty-state';
import { ModelCard } from '@/app/(models)/models/gateway-model-card';
import {
  ModelsProvider,
  useModels,
} from '@/app/(models)/models/models-context';

export default function HomePage() {
  return (
    <ModelsProvider>
      <ModelsPageContent />
    </ModelsProvider>
  );
}

function ModelsPageContent() {
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    resetFiltersAndSearch,
  } = useModels();

  const deferredSearch = useDeferredValue(searchQuery);
  const deferredFilters = useDeferredValue(filters);
  const deferredSort = useDeferredValue(sortBy);

  const searchFilteredData = useMemo(() => {
    if (!deferredSearch) return allChatModels;
    const q = deferredSearch.toLowerCase();
    return allChatModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.owned_by.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q),
    );
  }, [deferredSearch]);

  const filteredModels: ModelDefinition[] = useMemo(() => {
    const f = deferredFilters;
    const list = searchFilteredData.filter((m) => {
      if (f.providers.length > 0 && !f.providers.includes(m.owned_by))
        return false;
      if (f.inputModalities.length > 0) {
        const fi = m.features?.input;
        const set = new Set<string>(
          [
            fi?.text ? 'text' : '',
            fi?.image ? 'image' : '',
            fi?.audio ? 'audio' : '',
            fi?.pdf ? 'pdf' : '',
            fi?.video ? 'video' : '',
          ].filter(Boolean),
        );
        if (!f.inputModalities.some((val) => set.has(val))) return false;
      }
      if (f.outputModalities.length > 0) {
        const fo = m.features?.output;
        const set = new Set<string>(
          [
            fo?.text ? 'text' : '',
            fo?.image ? 'image' : '',
            fo?.audio ? 'audio' : '',
          ].filter(Boolean),
        );
        if (!f.outputModalities.some((val) => set.has(val))) return false;
      }
      const contextOk =
        m.context_window >= f.contextLength[0] &&
        m.context_window <= f.contextLength[1];
      if (!contextOk) return false;
      const maxTokensOk =
        (m.max_tokens ?? 0) >= f.maxTokens[0] &&
        (m.max_tokens ?? 0) <= f.maxTokens[1];
      if (!maxTokensOk) return false;
      const inputPrice = Number.parseFloat(m.pricing.input) * 1_000_000;
      const outputPrice = Number.parseFloat(m.pricing.output) * 1_000_000;
      if (inputPrice < f.inputPricing[0] || inputPrice > f.inputPricing[1])
        return false;
      if (outputPrice < f.outputPricing[0] || outputPrice > f.outputPricing[1])
        return false;
      if (f.features.reasoning && !m.features?.reasoning) return false;
      if (f.features.toolCall && !m.features?.toolCall) return false;
      if (
        f.features.temperatureControl &&
        m.features?.fixedTemperature !== undefined
      )
        return false;
      return true;
    });
    return list;
  }, [deferredFilters, searchFilteredData]);

  const sortedModels: ModelDefinition[] = useMemo(() => {
    const s = deferredSort;
    return [...filteredModels].sort(
      (a: ModelDefinition, b: ModelDefinition) => {
        switch (s) {
          case 'newest':
            return b.id.localeCompare(a.id);
          case 'pricing-low':
            return (
              Number.parseFloat(a.pricing.input) * 1_000_000 -
              Number.parseFloat(b.pricing.input) * 1_000_000
            );
          case 'pricing-high':
            return (
              Number.parseFloat(b.pricing.input) * 1_000_000 -
              Number.parseFloat(a.pricing.input) * 1_000_000
            );
          case 'context-high':
            return b.context_window - a.context_window;
          case 'context-low':
            return a.context_window - b.context_window;
          default:
            return 0;
        }
      },
    );
  }, [filteredModels, deferredSort]);

  const clearSearch = () => setSearchQuery('');

  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[auto_1fr] ">
      <aside className="hidden md:block md:h-full min-h-0 w-full md:w-64 bg-sidebar">
        <ScrollArea className="h-full">
          <ModelFilters
            filters={filters}
            onFiltersChange={setFilters}
            className="p-4 overflow-y-auto"
          />
        </ScrollArea>
      </aside>

      <main className="min-h-0 md:h-full">
        <ScrollArea className="h-full">
          <div className="p-4 lg:p-6 max-w-4xl mx-auto">
            <div className="mb-4">
              <PureModelListHeader
                title="Models"
                filtered={filteredModels.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={clearSearch}
                sortBy={sortBy}
                onChangeSort={setSortBy}
                onClearAll={resetFiltersAndSearch}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            <div className="flex flex-col gap-4">
              {sortedModels.length === 0 ? (
                <PureEmptyState onClearAll={resetFiltersAndSearch} />
              ) : (
                sortedModels.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
