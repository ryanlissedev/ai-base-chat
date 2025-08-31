'use client';

import { useState, useMemo } from 'react';
import {
  chatModels as allChatModels,
  type ModelDefinition,
} from '@/lib/ai/all-models';

import { ModelCard } from '@/app/(models)/models/gateway-model-card';

import type { FilterState } from '@/app/(models)/models/model-filters';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModelFilters } from '@/app/(models)/models/model-filters';
import { PureModelsToolbar } from '@/app/(models)/models/components/models-toolbar';
import { PureResultsHeader } from '@/app/(models)/models/components/results-header';
import { PureEmptyState } from '@/app/(models)/models/components/empty-state';

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

  const filteredModels: ModelDefinition[] = useMemo(() => {
    const filtered = allChatModels.filter((model) => {
      if (
        searchQuery &&
        !model.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !model.owned_by.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !model.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (filters.inputModalities.length > 0) {
        const inputs = model.features?.input;
        const hasAny = filters.inputModalities.some((modality) => {
          if (modality === 'text') return inputs?.text;
          if (modality === 'image') return inputs?.image;
          if (modality === 'audio') return inputs?.audio;
          if (modality === 'pdf') return inputs?.pdf;
          if (modality === 'video') return inputs?.video;
          return false;
        });
        if (!hasAny) return false;
      }

      if (filters.outputModalities.length > 0) {
        const outputs = model.features?.output;
        const hasAny = filters.outputModalities.some((modality) => {
          if (modality === 'text') return outputs?.text;
          if (modality === 'image') return outputs?.image;
          if (modality === 'audio') return outputs?.audio;
          return false;
        });
        if (!hasAny) return false;
      }

      if (
        model.context_window < filters.contextLength[0] ||
        model.context_window > filters.contextLength[1]
      ) {
        return false;
      }

      // Providers
      if (
        filters.providers.length > 0 &&
        !filters.providers.includes(model.owned_by)
      ) {
        return false;
      }

      // Features
      if (filters.features?.reasoning) {
        if (!model.features?.reasoning) return false;
      }
      if (filters.features?.toolCall) {
        if (!model.features?.toolCall) return false;
      }
      if (filters.features?.temperatureControl) {
        // Temperature control means temperature is adjustable (not fixed)
        if (model.features?.fixedTemperature !== undefined) return false;
      }

      // Output tokens
      if (
        model.max_tokens < filters.maxTokens[0] ||
        model.max_tokens > filters.maxTokens[1]
      ) {
        return false;
      }

      // Pricing ranges (filters are in $/1M tokens; model pricing is $/token)
      const inputPrice = Number.parseFloat(model.pricing.input) * 1_000_000;
      const outputPrice = Number.parseFloat(model.pricing.output) * 1_000_000;
      if (
        inputPrice < filters.inputPricing[0] ||
        inputPrice > filters.inputPricing[1]
      ) {
        return false;
      }
      if (
        outputPrice < filters.outputPricing[0] ||
        outputPrice > filters.outputPricing[1]
      ) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // No releaseDate field; use id as a stable proxy for recency
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
    });
  }, [searchQuery, filters, sortBy]);

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
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h1 className="text-xl font-semibold tracking-tight">
                      Models
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      All the models in Vercel AI Gateway
                    </p>
                  </div>
                  <PureResultsHeader
                    total={allChatModels.length}
                    filtered={filteredModels.length}
                    searchQuery={searchQuery}
                  />
                </div>

                <div>
                  <PureModelsToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onClearSearch={clearSearch}
                    sortBy={sortBy}
                    onChangeSort={setSortBy}
                    onClearAll={resetFiltersAndSearch}
                  />
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4">
                {filteredModels.length === 0 ? (
                  <PureEmptyState onClearAll={resetFiltersAndSearch} />
                ) : (
                  filteredModels.map((model) => (
                    <ModelCard key={model.id} model={model} isLoading={false} />
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
