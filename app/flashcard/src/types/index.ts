// ============================================
// Word State Machine (mirrored from backend)
// ============================================

export type WordState = 'NEW' | 'LEARNING' | 'REVIEWING' | 'MASTERED';
export type ProgressAction = 'remembered' | 'forgot' | 'reset';

export const ALL_STATES: WordState[] = ['NEW', 'LEARNING', 'REVIEWING', 'MASTERED'];

/**
 * Client-side state engine — identical logic to backend.
 * Used for optimistic updates so the UI never waits.
 */
export function computeNextState(
  currentState: WordState,
  action: ProgressAction
): WordState {
  if (action === 'reset') return 'NEW';
  if (action === 'forgot') return 'LEARNING';

  // action === 'remembered'
  switch (currentState) {
    case 'NEW':
      return 'MASTERED'; // Fast-track
    case 'LEARNING':
      return 'REVIEWING';
    case 'REVIEWING':
      return 'MASTERED';
    case 'MASTERED':
      return 'MASTERED';
  }
}

// ============================================
// Data Models
// ============================================

export interface Word {
  /** Local string ID for guest mode, or server numeric ID as string */
  id: string;
  wordText: string;
  definition: string | null;
  synonyms: string | null;
  banglaMeaning?: string | null;
  imageUrl: string | null;
  currentState: WordState;
  createdAt: string;
}

/** Section data for alphabetical SectionList */
export interface WordSection {
  letter: string;
  data: Word[];
}

// ============================================
// API Response Types (from backend)
// ============================================

export interface ApiBulkAddResponse {
  added: number;
  duplicates: number;
  words: Array<{ id: number; wordText: string }>;
}

export interface ApiProgressResponse {
  wordId: number;
  previousState: WordState;
  newState: WordState;
}

export interface ApiWordListResponse {
  words: ApiWordResponse[];
  nextCursor: string | null;
  total: number;
}

export interface ApiWordResponse {
  id: number;
  wordText: string;
  definition: string | null;
  synonyms: string | null;
  banglaMeaning?: string | null;
  imageUrl: string | null;
  currentState: WordState;
  createdAt: string;
}

// ============================================
// Dictionary API Types (Free Dictionary API)
// ============================================

export interface DictionaryResult {
  definition: string;
  synonyms: string | null;
  partOfSpeech: string | null;
  example: string | null;
  phonetic: string | null;
}

// ============================================
// Helpers
// ============================================

/** Groups a flat word array into alphabetical sections */
export function groupWordsAlphabetically(words: Word[]): WordSection[] {
  const sorted = [...words].sort((a, b) =>
    a.wordText.localeCompare(b.wordText)
  );

  const sections: Map<string, Word[]> = new Map();
  for (const word of sorted) {
    const letter = word.wordText.charAt(0).toUpperCase();
    if (!sections.has(letter)) {
      sections.set(letter, []);
    }
    sections.get(letter)!.push(word);
  }

  return Array.from(sections.entries()).map(([letter, data]) => ({
    letter,
    data,
  }));
}

/** Generates a unique local ID for guest-mode words */
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** State display labels */
export const STATE_LABELS: Record<WordState, string> = {
  NEW: 'Dictionary',
  LEARNING: 'Learning',
  REVIEWING: 'Reviewing',
  MASTERED: 'Mastered',
};

/** State tab icons (Ionicons names) */
export const STATE_ICONS: Record<WordState, { outline: string; filled: string }> = {
  NEW: { outline: 'book-outline', filled: 'book' },
  LEARNING: { outline: 'school-outline', filled: 'school' },
  REVIEWING: { outline: 'refresh-outline', filled: 'refresh' },
  MASTERED: { outline: 'star-outline', filled: 'star' },
};
