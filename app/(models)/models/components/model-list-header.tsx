'use client';

import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/models/search-input';
import { SortSelect } from '@/components/models/sort-select';
import { FilterSheet } from '@/components/models/filter-sheet';
import { RotateCcw } from 'lucide-react';
import type { SortOption } from '@/components/models/types';
import type { FilterState } from '@/app/(models)/models/model-filters';

// SortOption moved to shared type

export const PureModelListHeader = memo(function PureModelsHeader({
  title = 'Models',
  total,
  filtered,
  searchQuery,
  onSearchChange,
  onClearSearch,
  sortBy,
  onChangeSort,
  onClearAll,
  filters,
  onFiltersChange,
}: {
  title?: string;
  total: number;
  filtered: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  sortBy: SortOption;
  onChangeSort: (value: SortOption) => void;
  onClearAll: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}) {
  const hasActiveFilters = useMemo(() => {
    const defaultContext: [number, number] = [1000, 1000000];
    const defaultInputPricing: [number, number] = [0, 20];
    const defaultOutputPricing: [number, number] = [0, 20];
    const defaultMaxTokens: [number, number] = [0, 300000];

    const rangeEquals = (a: [number, number], b: [number, number]): boolean =>
      a[0] === b[0] && a[1] === b[1];

    const anyArraysActive =
      filters.inputModalities.length > 0 ||
      filters.outputModalities.length > 0 ||
      filters.providers.length > 0 ||
      filters.series.length > 0 ||
      filters.categories.length > 0 ||
      filters.supportedParameters.length > 0;

    const anyFeaturesActive =
      !!filters.features.reasoning ||
      !!filters.features.toolCall ||
      !!filters.features.temperatureControl;

    const anyRangesActive =
      !rangeEquals(filters.contextLength, defaultContext) ||
      !rangeEquals(filters.inputPricing, defaultInputPricing) ||
      !rangeEquals(filters.outputPricing, defaultOutputPricing) ||
      !rangeEquals(filters.maxTokens, defaultMaxTokens);

    return anyArraysActive || anyFeaturesActive || anyRangesActive;
  }, [
    filters.inputModalities,
    filters.outputModalities,
    filters.providers,
    filters.series,
    filters.categories,
    filters.supportedParameters,
    filters.features,
    filters.contextLength,
    filters.inputPricing,
    filters.outputPricing,
    filters.maxTokens,
  ]);
  const activeFiltersCount = useMemo(() => {
    const defaultContext: [number, number] = [1000, 1000000];
    const defaultInputPricing: [number, number] = [0, 20];
    const defaultOutputPricing: [number, number] = [0, 20];
    const defaultMaxTokens: [number, number] = [0, 300000];

    const rangeEquals = (a: [number, number], b: [number, number]): boolean =>
      a[0] === b[0] && a[1] === b[1];

    let count = 0;

    count += filters.inputModalities.length;
    count += filters.outputModalities.length;
    count += filters.providers.length;
    count += filters.series.length;
    count += filters.categories.length;
    count += filters.supportedParameters.length;

    count += filters.features.reasoning ? 1 : 0;
    count += filters.features.toolCall ? 1 : 0;
    count += filters.features.temperatureControl ? 1 : 0;

    count += rangeEquals(filters.contextLength, defaultContext) ? 0 : 1;
    count += rangeEquals(filters.inputPricing, defaultInputPricing) ? 0 : 1;
    count += rangeEquals(filters.outputPricing, defaultOutputPricing) ? 0 : 1;
    count += rangeEquals(filters.maxTokens, defaultMaxTokens) ? 0 : 1;

    return count;
  }, [
    filters.inputModalities,
    filters.outputModalities,
    filters.providers,
    filters.series,
    filters.categories,
    filters.supportedParameters,
    filters.features,
    filters.contextLength,
    filters.inputPricing,
    filters.outputPricing,
    filters.maxTokens,
  ]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {'from '}
            <a
              href="https://vercel.com/docs/ai-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Vercel AI Gateway
            </a>
          </p>
        </div>
      </div>

      {/* Controls - mobile */}
      <div className="flex flex-col gap-2 sm:hidden">
        {/* First row: search bar only */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />

        {/* Second row: filter + sort */}
        <div className="flex items-center gap-2">
          <FilterSheet
            filters={filters}
            onFiltersChange={onFiltersChange}
            onClearAll={onClearAll}
            activeFiltersCount={activeFiltersCount}
          />

          <div className="grow">
            <SortSelect value={sortBy} onChange={onChangeSort} />
          </div>
        </div>
      </div>

      {/* Controls - desktop */}
      <div className="hidden sm:flex items-center justify-between gap-3">
        {/* Filters button hidden on desktop because filters are visible elsewhere */}
        <div className="flex items-center gap-2 grow">
          <div className="relative w-full max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              onClear={onClearSearch}
            />
          </div>
          <SortSelect value={sortBy} onChange={onChangeSort} />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={onClearAll}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results count row */}
      <div className="text-sm text-muted-foreground">
        {filtered} models found
      </div>
    </div>
  );
});
