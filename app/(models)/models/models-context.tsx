'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { FilterState } from '@/app/(models)/models/model-filters';

export type SortOption =
  | 'newest'
  | 'pricing-low'
  | 'pricing-high'
  | 'context-high'
  | 'context-low';

type ModelsContextValue = {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  filters: FilterState;
  setFilters: (v: FilterState) => void;
  resetFiltersAndSearch: () => void;
};

const DEFAULT_FILTERS: FilterState = {
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
};

const ModelsContext = createContext<ModelsContextValue | null>(null);

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const resetFiltersAndSearch = useCallback(() => {
    setSearchQuery('');
    setFilters(DEFAULT_FILTERS);
  }, []);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
      filters,
      setFilters,
      resetFiltersAndSearch,
    }),
    [searchQuery, sortBy, filters, resetFiltersAndSearch],
  );

  return (
    <ModelsContext.Provider value={value}>{children}</ModelsContext.Provider>
  );
}

export function useModels() {
  const ctx = useContext(ModelsContext);
  if (!ctx) throw new Error('useModels must be used within ModelsProvider');
  return ctx;
}
