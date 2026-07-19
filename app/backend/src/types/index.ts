// ============================================
// Word State Machine
// ============================================

export type WordState = 'NEW' | 'LEARNING' | 'REVIEWING' | 'MASTERED';
export type ProgressAction = 'remembered' | 'forgot' | 'reset';

// ============================================
// API Request / Response types
// ============================================

export interface BulkAddRequest {
  /** Raw text of words separated by commas or newlines */
  text: string;
}

export interface BulkAddResponse {
  added: number;
  duplicates: number;
  words: Array<{ id: number; wordText: string }>;
}

export interface ProgressUpdateRequest {
  wordId: number;
  action: ProgressAction;
}

export interface ProgressUpdateResponse {
  wordId: number;
  previousState: WordState;
  newState: WordState;
}

export interface WordResponse {
  id: number;
  wordText: string;
  definition: string | null;
  synonyms: string | null;
  imageUrl: string | null;
  currentState: WordState;
  createdAt: string;
}

export interface WordListResponse {
  words: WordResponse[];
  nextCursor: string | null;
  total: number;
}

// ============================================
// Cloudflare Workers Bindings
// ============================================

export interface Env {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}
