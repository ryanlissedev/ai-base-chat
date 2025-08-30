'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import { useSession } from 'next-auth/react';
import type { User } from 'next-auth';
import { HeaderActions } from '@/components/header-actions';

function PureModelsHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as User | undefined;
  const isAuthenticated = !!user;

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header
      className={cn(
        'border-b border-border bg-background h-11 px-2 flex items-center size-full justify-between gap-6',
        className,
      )}
    >
      <Link href="/" className="py-2">
        <span className="text-lg font-semibold hover:bg-muted rounded-md cursor-pointer flex items-center gap-2 h-9 px-2">
          <Image
            src="/icon.svg"
            alt="Sparka AI"
            width={24}
            height={24}
            className="size-6"
          />
          Sparka
        </span>
      </Link>

      <nav className="flex items-center gap-6">
        <Link
          href="/"
          className={cn(
            'text-sm font-medium transition-colors hover:text-foreground',
            isActive('/') ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          Chat
        </Link>
        <Link
          href="/models"
          className={cn(
            'text-sm font-medium transition-colors hover:text-foreground',
            isActive('/models') ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          Models
        </Link>
        <Link
          href="/compare"
          className={cn(
            'text-sm font-medium transition-colors hover:text-foreground',
            isActive('/compare') ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          Compare
        </Link>
      </nav>

      <HeaderActions user={user} />
    </header>
  );
}

export const ModelsHeader = memo(PureModelsHeader);
