import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  pgEnum,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ============================================
// Enums
// ============================================

export const wordStateEnum = pgEnum('word_state', [
  'NEW',
  'LEARNING',
  'REVIEWING',
  'MASTERED',
]);

// ============================================
// Words — global dictionary of words (shared)
// ============================================

export const words = pgTable(
  'words',
  {
    id: serial('id').primaryKey(),
    wordText: varchar('word_text', { length: 255 }).notNull().unique(),
    definition: text('definition'),
    synonyms: text('synonyms'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('word_text_idx').on(table.wordText)]
);

// ============================================
// User Flashcards — per-user word state mapping
// ============================================

export const userFlashcards = pgTable(
  'user_flashcards',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    wordId: integer('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
    currentState: wordStateEnum('current_state').notNull().default('NEW'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // Composite index for blazing-fast state-filtered queries
    index('user_state_idx').on(table.userId, table.currentState),
    // Prevent duplicate user-word pairs
    uniqueIndex('user_word_unique').on(table.userId, table.wordId),
  ]
);

// ============================================
// Collections — predefined decks for onboarding
// ============================================

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collectionWords = pgTable(
  'collection_words',
  {
    id: serial('id').primaryKey(),
    collectionId: integer('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    wordId: integer('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('collection_word_unique').on(table.collectionId, table.wordId),
  ]
);

// ============================================
// Better Auth tables
// ============================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified').notNull().default(0),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
