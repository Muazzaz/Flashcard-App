import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { createDb } from '../db';
import { collections, collectionWords, words, userFlashcards } from '../db/schema';
import { createAuth } from '../middleware/auth';
import type { Env } from '../types';

type Variables = {
  userId: string;
};

const collectionRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================
// GET /api/collections — List available decks (public)
// ============================================
collectionRoutes.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);

  const results = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      createdAt: collections.createdAt,
    })
    .from(collections);

  return c.json({ collections: results });
});

// ============================================
// POST /api/collections/:id/clone — Clone deck into user's NEW tab
// ============================================
collectionRoutes.post('/:id/clone', async (c) => {
  // This route requires auth
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: 'Authentication required to clone a collection.' }, 401);
  }

  const userId = session.user.id;
  const db = createDb(c.env.DATABASE_URL);
  const collectionId = parseInt(c.req.param('id'));

  if (isNaN(collectionId)) {
    return c.json({ error: 'Invalid collection ID.' }, 400);
  }

  // Check collection exists
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!collection) {
    return c.json({ error: 'Collection not found.' }, 404);
  }

  // Get all words in the collection
  const collWords = await db
    .select({ wordId: collectionWords.wordId })
    .from(collectionWords)
    .where(eq(collectionWords.collectionId, collectionId));

  let clonedCount = 0;

  for (const { wordId } of collWords) {
    try {
      await db
        .insert(userFlashcards)
        .values({ userId, wordId, currentState: 'NEW' })
        .onConflictDoNothing(); // Skip if user already has this word

      clonedCount++;
    } catch {
      // Skip duplicates
    }
  }

  return c.json({
    message: `Cloned ${clonedCount} words from "${collection.name}" into your Dictionary.`,
    clonedCount,
    collectionName: collection.name,
  });
});

export default collectionRoutes;
