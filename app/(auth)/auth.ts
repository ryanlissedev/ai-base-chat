import NextAuth, { type User, type Session } from 'next-auth';

import { getUserByEmail, createUser } from '@/lib/db/queries';
import { createModuleLogger } from '@/lib/logger';

import { authConfig } from './auth.config';

const logger = createModuleLogger('auth');

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  // Disable OAuth providers for guest-only usage
  providers: [],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile || !user?.email) {
        logger.warn('Auth provider details missing (account, profile, or user email)');
        return false;
      }

      const { email, name, image } = user;

      try {
        const existingUserArray = await getUserByEmail(email);

        if (existingUserArray.length === 0) {
          await createUser({
            email,
            name: name ?? null,
            image: image ?? null,
          });
          logger.info(`Created new user: ${email}`);
        } else {
          logger.info(`User already exists: ${email}`);
        }
        return true;
      } catch (error) {
        logger.error({ error }, 'Error during signIn DB operations');
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (user?.email) {
        try {
          const dbUserArray = await getUserByEmail(user.email);
          if (dbUserArray.length > 0) {
            token.id = dbUserArray[0].id;
          } else {
            logger.error(`User not found in DB during jwt callback: ${user.email}`);
          }
        } catch (error) {
          logger.error({ error }, 'Error fetching user during jwt callback');
        }
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: { id?: string; [key: string]: any };
    }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      } else if (!token.id) {
        logger.error('Token ID missing in session callback');
      }
      return session;
    },
  },
});
