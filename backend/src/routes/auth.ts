import { Hono } from 'hono';
import { createAuth } from '../middleware/auth';
import type { Env } from '../types';

const authRoutes = new Hono<{ Bindings: Env }>();

/**
 * Mount Better Auth's handler on /api/auth/*.
 * Better Auth handles all auth routes internally:
 *   - POST /api/auth/sign-up/email
 *   - POST /api/auth/sign-in/email
 *   - POST /api/auth/sign-in/social (Google)
 *   - GET  /api/auth/session
 *   - POST /api/auth/sign-out
 *   - GET  /api/auth/callback/:provider
 *   etc.
 */
authRoutes.on(['GET', 'POST'], '/*', async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

export default authRoutes;
