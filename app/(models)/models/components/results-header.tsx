'use client';

import { memo } from 'react';

export const PureResultsHeader = memo(function PureResultsHeader({
  filtered,
}: {
  total: number;
  filtered: number;
  searchQuery: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">{filtered} models</div>
    </div>
  );
});
