'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';

export const PureEmptyState = memo(function PureEmptyState({
  onClearAll,
}: {
  onClearAll: () => void;
}) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">
        No models found matching your criteria.
      </p>
      <Button variant="outline" onClick={onClearAll}>
        Clear all filters
      </Button>
    </div>
  );
});
