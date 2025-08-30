'use client';

import { memo } from 'react';

export const PureResultsHeader = memo(function PureResultsHeader({
  total,
  filtered,
  searchQuery,
  isPending,
}: {
  total: number;
  filtered: number;
  searchQuery: string;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {filtered} of {total} models
        {searchQuery && (
          <span className="ml-2">for &quot;{searchQuery}&quot;</span>
        )}
      </div>
      {isPending && (
        <div className="text-sm text-muted-foreground">Updating...</div>
      )}
    </div>
  );
});
