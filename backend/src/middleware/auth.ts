import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDb } from '../db';
import type { Env } from '../types';

/**
 * Creates a Better Auth instance per-request.
 * Required in Cloudflare Workers because env bindings are request-scoped.
 */
export function createAuth(env: Env) {
  const db = createDb(env.DATABASE_URL);

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Refresh session age every 24h
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
