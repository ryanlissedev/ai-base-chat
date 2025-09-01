'use client';

import { memo, useMemo } from 'react';
import { Search, X, RotateCcw, Filter as FilterIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { FilterState } from '@/app/(models)/models/model-filters';
import { ModelFilters } from '@/app/(models)/models/model-filters';

type SortOption =
  | 'newest'
  | 'pricing-low'
  | 'pricing-high'
  | 'context-high'
  | 'context-low';

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
          <span className="text-sm text-muted-foreground">
            {filtered} models found
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Mobile filters */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="relative md:hidden"
            >
              <FilterIcon className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] rounded-full bg-primary text-primary-foreground text-[10px] leading-4 px-0.5 text-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="border-b">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-y-auto">
              <ModelFilters
                filters={filters}
                onFiltersChange={onFiltersChange}
                className="p-4"
              />
            </div>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                onClick={onClearAll}
                className="w-full justify-center"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Clear filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 grow">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => onChangeSort(value)}
          >
            <SelectTrigger className="max-w-40">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="text-sm">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="pricing-low">$ Low → High</SelectItem>
              <SelectItem value="pricing-high">$ High → Low</SelectItem>
              <SelectItem value="context-high">Context High → Low</SelectItem>
              <SelectItem value="context-low">Context Low → High</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="hidden md:inline-flex"
              onClick={onClearAll}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
