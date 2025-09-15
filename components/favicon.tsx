import { cn } from '@/lib/utils';
import type React from 'react';

export function Favicon({
  url,
  className,
  ...props
}: {
  url: string;
  className?: string;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Favicon requires <img> for external URLs, Next.js Image doesn't support dynamic external favicons
    <img
      src={url}
      className={cn('w-4 h-4', className)}
      {...props}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        target.nextElementSibling?.classList.remove('hidden');
      }}
      alt={`Favicon for ${url}`}
    />
  );
}
