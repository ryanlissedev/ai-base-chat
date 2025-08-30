'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header
      className={cn(
        'border-b border-border bg-background h-14 px-6 flex items-center justify-start gap-8',
        className,
      )}
    >
      <div className="flex h-full items-center gap-8">
        <Link href="/" className="text-xl font-semibold text-foreground">
          Sparka
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={cn(
              'text-sm font-medium transition-colors hover:text-foreground',
              isActive('/') ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            Models
          </Link>
          <Link
            href="/compare"
            className={cn(
              'text-sm font-medium transition-colors hover:text-foreground',
              isActive('/compare')
                ? 'text-foreground'
                : 'text-muted-foreground',
            )}
          >
            Compare
          </Link>
        </nav>
      </div>
    </header>
  );
}
