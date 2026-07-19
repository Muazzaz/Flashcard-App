import { Hono } from 'hono';
import { eq, and, asc, sql, gt } from 'drizzle-orm';
import { createDb } from '../db';
import { words, userFlashcards } from '../db/schema';
import { createAuth } from '../middleware/auth';
import { computeNextState, isValidAction, isValidState } from '../services/stateEngine';
import { fetchDefinition } from '../services/dictionary';
import type { Env, WordState, BulkAddResponse, ProgressUpdateResponse, WordListResponse, WordResponse } from '../types';

type Variables = {
  userId: string;
};

const wordRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Auth middleware — validates session and injects userId.
 * All word routes require authentication (user must save progress).
 */
wordRoutes.use('/*', async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: 'Authentication required. Please sign in to save your progress.' }, 401);
  }

  c.set('userId', session.user.id);
  await next();
});

// ============================================
// POST /api/words/bulk — Bulk import words
// ============================================
wordRoutes.post('/bulk', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DATABASE_URL);

  const body = await c.req.json<{ text: string }>();
  if (!body.text || typeof body.text !== 'string') {
    return c.json({ error: 'Missing "text" field with words to add.' }, 400);
  }

  // Parse: split by commas, newlines, or semicolons, then sanitize
  const rawWords = body.text
    .split(/[,\n;]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && w.length <= 100)
    // Remove non-alphabetic words (allow hyphens and apostrophes)
    .filter((w) => /^[a-z][a-z'\-\s]*$/.test(w));

  // Deduplicate
  const uniqueWords = [...new Set(rawWords)];

  if (uniqueWords.length === 0) {
    return c.json({ error: 'No valid words found in the input.' }, 400);
  }

  let addedCount = 0;
  let duplicateCount = 0;
  const addedWords: Array<{ id: number; wordText: string }> = [];

  for (const wordText of uniqueWords) {
    try {
      // Upsert the word into the global words table
      const [word] = await db
        .insert(words)
        .values({ wordText })
        .onConflictDoNothing({ target: words.wordText })
        .returning({ id: words.id, wordText: words.wordText });

      // If word already existed, fetch its id
      let wordId: number;
      let wordTextResult: string;
      if (word) {
        wordId = word.id;
        wordTextResult = word.wordText;
      } else {
        const existing = await db
          .select({ id: words.id, wordText: words.wordText })
          .from(words)
          .where(eq(words.wordText, wordText))
          .limit(1);
        if (!existing[0]) continue;
        wordId = existing[0].id;
        wordTextResult = existing[0].wordText;
      }

      // Create user-word mapping with NEW state (skip if already exists)
      const [flashcard] = await db
        .insert(userFlashcards)
        .values({ userId, wordId, currentState: 'NEW' })
        .onConflictDoNothing()
        .returning({ id: userFlashcards.id });

      if (flashcard) {
        addedCount++;
        addedWords.push({ id: wordId, wordText: wordTextResult });
      } else {
        duplicateCount++;
      }
    } catch (err) {
      console.error(`Error adding word "${wordText}":`, err);
      duplicateCount++;
    }
  }

  const response: BulkAddResponse = {
    added: addedCount,
    duplicates: duplicateCount,
    words: addedWords,
  };

  return c.json(response, 201);
});

// ============================================
// GET /api/words — List words by state (alphabetical)
// ============================================
wordRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DATABASE_URL);

  const stateParam = c.req.query('state');
  const cursor = c.req.query('cursor'); // word_text cursor for pagination
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

  if (stateParam && !isValidState(stateParam)) {
    return c.json({ error: 'Invalid state. Must be NEW, LEARNING, REVIEWING, or MASTERED.' }, 400);
  }

  // Build query conditions
  const conditions = [eq(userFlashcards.userId, userId)];

  if (stateParam) {
    conditions.push(eq(userFlashcards.currentState, stateParam as WordState));
  }

  if (cursor) {
    conditions.push(gt(words.wordText, cursor));
  }

  // Query with join, filtered by state, sorted alphabetically
  const results = await db
    .select({
      id: words.id,
      wordText: words.wordText,
      definition: words.definition,
      synonyms: words.synonyms,
      imageUrl: words.imageUrl,
      currentState: userFlashcards.currentState,
      createdAt: userFlashcards.createdAt,
    })
    .from(userFlashcards)
    .innerJoin(words, eq(userFlashcards.wordId, words.id))
    .where(and(...conditions))
    .orderBy(asc(words.wordText))
    .limit(limit + 1); // Fetch one extra to check if there's a next page

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;

  const wordList: WordResponse[] = items.map((r) => ({
    id: r.id,
    wordText: r.wordText,
    definition: r.definition,
    synonyms: r.synonyms,
    imageUrl: r.imageUrl,
    currentState: r.currentState,
    createdAt: r.createdAt.toISOString(),
  }));

  // Count total for this state
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userFlashcards)
    .where(
      stateParam
        ? and(eq(userFlashcards.userId, userId), eq(userFlashcards.currentState, stateParam as WordState))
        : eq(userFlashcards.userId, userId)
    );

  const response: WordListResponse = {
    words: wordList,
    nextCursor: hasMore ? items[items.length - 1].wordText : null,
    total: countResult?.count ?? 0,
  };

  return c.json(response);
});

// ============================================
// GET /api/words/:id — Get word detail (lazy-loads definition)
// ============================================
wordRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DATABASE_URL);
  const wordId = parseInt(c.req.param('id'));

  if (isNaN(wordId)) {
    return c.json({ error: 'Invalid word ID.' }, 400);
  }

  // Fetch word with user's state
  const [result] = await db
    .select({
      id: words.id,
      wordText: words.wordText,
      definition: words.definition,
      synonyms: words.synonyms,
      imageUrl: words.imageUrl,
      currentState: userFlashcards.currentState,
      createdAt: userFlashcards.createdAt,
    })
    .from(userFlashcards)
    .innerJoin(words, eq(userFlashcards.wordId, words.id))
    .where(and(eq(userFlashcards.userId, userId), eq(words.id, wordId)))
    .limit(1);

  if (!result) {
    return c.json({ error: 'Word not found.' }, 404);
  }

  // LAZY-LOAD: If definition is null, fetch from dictionary API and save
  if (!result.definition) {
    const dictResult = await fetchDefinition(result.wordText);
    if (dictResult) {
      await db
        .update(words)
        .set({
          definition: dictResult.definition,
          synonyms: dictResult.synonyms,
        })
        .where(eq(words.id, wordId));

      result.definition = dictResult.definition;
      result.synonyms = dictResult.synonyms;
    }
  }

  const response: WordResponse = {
    id: result.id,
    wordText: result.wordText,
    definition: result.definition,
    synonyms: result.synonyms,
    imageUrl: result.imageUrl,
    currentState: result.currentState,
    createdAt: result.createdAt.toISOString(),
  };

  return c.json(response);
});

// ============================================
// PUT /api/words/progress — Update word state
// ============================================
wordRoutes.put('/progress', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DATABASE_URL);

  const body = await c.req.json<{ wordId: number; action: string }>();

  if (!body.wordId || !body.action) {
    return c.json({ error: 'Missing "wordId" or "action" field.' }, 400);
  }

  if (!isValidAction(body.action)) {
    return c.json({ error: 'Invalid action. Must be "remembered", "forgot", or "reset".' }, 400);
  }

  // Fetch current state
  const [flashcard] = await db
    .select({ id: userFlashcards.id, currentState: userFlashcards.currentState })
    .from(userFlashcards)
    .innerJoin(words, eq(userFlashcards.wordId, words.id))
    .where(and(eq(userFlashcards.userId, userId), eq(words.id, body.wordId)))
    .limit(1);

  if (!flashcard) {
    return c.json({ error: 'Word not found in your collection.' }, 404);
  }

  const previousState = flashcard.currentState;
  const newState = computeNextState(previousState, body.action);

  // Update state
  await db
    .update(userFlashcards)
    .set({ currentState: newState })
    .where(eq(userFlashcards.id, flashcard.id));

  const response: ProgressUpdateResponse = {
    wordId: body.wordId,
    previousState,
    newState,
  };

  return c.json(response);
});

// ============================================
// PUT /api/words/bulk-progress — Bulk update state
// ============================================
wordRoutes.put('/bulk-progress', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DATABASE_URL);

  const body = await c.req.json<{ wordIds: number[]; action: string }>();

  if (!body.wordIds || !Array.isArray(body.wordIds) || !body.action) {
    return c.json({ error: 'Missing "wordIds" array or "action" field.' }, 400);
  }

  if (!isValidAction(body.action)) {
    return c.json({ error: 'Invalid action.' }, 400);
  }

  const results: ProgressUpdateResponse[] = [];

  for (const wordId of body.wordIds) {
    const [flashcard] = await db
      .select({ id: userFlashcards.id, currentState: userFlashcards.currentState })
      .from(userFlashcards)
      .innerJoin(words, eq(userFlashcards.wordId, words.id))
      .where(and(eq(userFlashcards.userId, userId), eq(words.id, wordId)))
      .limit(1);

    if (!flashcard) continue;

    const previousState = flashcard.currentState;
    const newState = computeNextState(previousState, body.action);

    await db
      .update(userFlashcards)
      .set({ currentState: newState })
      .where(eq(userFlashcards.id, flashcard.id));

    results.push({ wordId, previousState, newState });
  }

  return c.json({ updated: results });
});

export default wordRoutes;
