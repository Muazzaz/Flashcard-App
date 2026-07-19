import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import wordRoutes from './routes/words';
import collectionRoutes from './routes/collections';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// ============================================
// Global Middleware
// ============================================

// Request logging
app.use('*', logger());

// CORS — allow mobile app and local development
app.use(
  '*',
  cors({
    origin: ['*'], // In production, restrict to your app's origin
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
    maxAge: 600,
  })
);

// ============================================
// Health Check
// ============================================

app.get('/', (c) => {
  return c.json({
    name: 'Vocab API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Route Mounting
// ============================================

// Better Auth handles: sign-up, sign-in (email + Google), session, sign-out
app.route('/api/auth', authRoutes);

// Word CRUD + state transitions (requires auth)
app.route('/api/words', wordRoutes);

// Predefined collections / decks
app.route('/api/collections', collectionRoutes);

// ============================================
// 404 Fallback
// ============================================

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// ============================================
// Global Error Handler
// ============================================

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
    },
    500
  );
});

export default app;
