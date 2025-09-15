import type { NextAuthConfig } from 'next-auth';
import type { NextRequest } from 'next/server';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  secret: process.env.AUTH_SECRET || 'test-secret',
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    async authorized() {
      // Allow all routes (guests can use chat and all enabled models)
      return true;
    },
  },
} satisfies NextAuthConfig;
