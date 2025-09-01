'use client';

import { memo } from 'react';
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

export const PureModelsHeader = memo(function PureModelsHeader({
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
        <div className="flex items-center gap-2">
          {/* Mobile filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" className="md:hidden">
                <FilterIcon className="mr-2 h-4 w-4" />
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
        </div>

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
            <SelectTrigger className="h-8 max-w-40 text-xs">
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

          <Button
            variant="ghost"
            className="hidden md:inline-flex"
            onClick={onClearAll}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
});
