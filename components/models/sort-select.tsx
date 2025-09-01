'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SortOption } from '@/components/models/types';

export function SortSelect({
  value,
  onChange,
  className,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v: SortOption) => onChange(v)}>
      <SelectTrigger className={`max-w-40 ${className ?? ''}`}>
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
  );
}
