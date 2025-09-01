'use client';

import { useMemo, useState } from 'react';
import {
  chatModels as allChatModels,
  type ModelDefinition,
} from '@/lib/ai/all-models';

import type { FilterState } from '@/app/(models)/models/model-filters';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModelFilters } from '@/app/(models)/models/model-filters';
import { PureModelsHeader } from '@/app/(models)/models/components/models-header';
import { PureEmptyState } from '@/app/(models)/models/components/empty-state';
import { ModelCard } from '@/app/(models)/models/gateway-model-card';

type SortOption =
  | 'newest'
  | 'pricing-low'
  | 'pricing-high'
  | 'context-high'
  | 'context-low';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<FilterState>({
    inputModalities: [],
    outputModalities: [],
    contextLength: [1000, 1000000],
    inputPricing: [0, 20],
    outputPricing: [0, 20],
    maxTokens: [0, 300000],
    providers: [],
    features: { reasoning: false, toolCall: false, temperatureControl: false },
    series: [],
    categories: [],
    supportedParameters: [],
  });

  // 1) Apply simple search pre-filtering (name/provider/description)
  const searchFilteredData = useMemo(() => {
    if (!searchQuery) return allChatModels;
    const q = searchQuery.toLowerCase();
    return allChatModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.owned_by.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Apply filters directly (no table)
  const filteredModels: ModelDefinition[] = useMemo(() => {
    const list = searchFilteredData.filter((m) => {
      // Provider
      if (
        filters.providers.length > 0 &&
        !filters.providers.includes(m.owned_by)
      )
        return false;
      // Input modalities
      if (filters.inputModalities.length > 0) {
        const f = m.features?.input;
        const set = new Set<string>(
          [
            f?.text ? 'text' : '',
            f?.image ? 'image' : '',
            f?.audio ? 'audio' : '',
            f?.pdf ? 'pdf' : '',
            f?.video ? 'video' : '',
          ].filter(Boolean),
        );
        if (!filters.inputModalities.some((val) => set.has(val))) return false;
      }
      // Output modalities
      if (filters.outputModalities.length > 0) {
        const f = m.features?.output;
        const set = new Set<string>(
          [
            f?.text ? 'text' : '',
            f?.image ? 'image' : '',
            f?.audio ? 'audio' : '',
          ].filter(Boolean),
        );
        if (!filters.outputModalities.some((val) => set.has(val))) return false;
      }
      // Numeric ranges
      const contextOk =
        m.context_window >= filters.contextLength[0] &&
        m.context_window <= filters.contextLength[1];
      if (!contextOk) return false;
      const maxTokensOk =
        (m.max_tokens ?? 0) >= filters.maxTokens[0] &&
        (m.max_tokens ?? 0) <= filters.maxTokens[1];
      if (!maxTokensOk) return false;
      const inputPrice = Number.parseFloat(m.pricing.input) * 1_000_000;
      const outputPrice = Number.parseFloat(m.pricing.output) * 1_000_000;
      if (
        inputPrice < filters.inputPricing[0] ||
        inputPrice > filters.inputPricing[1]
      )
        return false;
      if (
        outputPrice < filters.outputPricing[0] ||
        outputPrice > filters.outputPricing[1]
      )
        return false;
      // Feature flags
      if (filters.features.reasoning && !m.features?.reasoning) return false;
      if (filters.features.toolCall && !m.features?.toolCall) return false;
      if (
        filters.features.temperatureControl &&
        m.features?.fixedTemperature !== undefined
      )
        return false;
      return true;
    });

    return list;
  }, [filters, searchFilteredData]);

  // Sort after filtering
  const sortedModels: ModelDefinition[] = useMemo(() => {
    return [...filteredModels].sort(
      (a: ModelDefinition, b: ModelDefinition) => {
        switch (sortBy) {
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
  }, [filteredModels, sortBy]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const resetFiltersAndSearch = () => {
    setSearchQuery('');
    setFilters({
      inputModalities: [],
      outputModalities: [],
      contextLength: [1000, 1000000],
      inputPricing: [0, 20],
      outputPricing: [0, 20],
      maxTokens: [0, 300000],
      providers: [],
      features: {
        reasoning: false,
        toolCall: false,
        temperatureControl: false,
      },
      series: [],
      categories: [],
      supportedParameters: [],
    });
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[auto_1fr] ">
      <aside className="hidden md:block md:h-full min-h-0 w-full md:w-64 bg-sidebar">
        <ScrollArea className="h-full">
          {/* <div className="h-400" /> */}

          <ModelFilters
            filters={filters}
            onFiltersChange={setFilters}
            className="p-4 overflow-y-auto"
          />
        </ScrollArea>
      </aside>

      <main className="min-h-0 md:h-full">
        <ScrollArea className="h-full">
          <div className="p-4 lg:p-6">
            <div className="mb-4">
              <PureModelsHeader
                title="Models"
                total={allChatModels.length}
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

            <div className="space-y-4">
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
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
