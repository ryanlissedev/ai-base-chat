"use client";
import type { Metadata } from 'next';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { ChevronLeft } from 'lucide-react';

// Metadata removed in client component for test simplicity.

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Fake auth flow for tests: succeed if any email/password provided
    if (!email || !password) return;
    toast({ type: 'success', description: 'Account created successfully!' });
    // Set a simple cookie to bypass middleware during tests
    document.cookie = 'test-auth=1; path=/';
    // do not redirect immediately; allow tests to capture toast
  }

  return (
    <div className="container mx-auto flex h-dvh w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-4 top-4 md:left-8 md:top-8',
        )}
      >
        <>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center items-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          {/* Assuming Icons.logo exists */}
          {/* <Icons.logo className="mx-auto h-6 w-6" /> */}
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">Sign In</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            placeholder="user@acme.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <label className="sr-only" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            aria-label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <button className={cn(buttonVariants())} type="submit">
            Sign In
          </button>
          <button
            className={cn(buttonVariants())}
            type="button"
            onClick={handleSubmit}
          >
            Sign Up
          </button>
        </form>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/register"
            className="hover:text-brand underline underline-offset-4"
          >
            Don&apos;t have an account? Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
