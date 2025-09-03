'use client';

import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function LazyTooltip({
  label,
  children,
  content,
  asChild = true,
}: {
  label?: string;
  children: React.ReactElement;
  content: React.ReactNode;
  asChild?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);

  const triggerProps = {
    'aria-label': label,
    onPointerEnter: () => setEnabled(true),
    onTouchStart: () => setEnabled(true),
  } as const;

  if (!enabled) {
    // Clone to attach events without mounting Tooltip tree
    return { ...children, props: { ...children.props, ...triggerProps } };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild}>
        {
          // Attach the same listeners so once active, hover continues to work
          { ...children, props: { ...children.props, ...triggerProps } }
        }
      </TooltipTrigger>
      <TooltipContent>{content ?? label}</TooltipContent>
    </Tooltip>
  );
}
