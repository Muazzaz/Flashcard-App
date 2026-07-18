import type {
  ApiBulkAddResponse,
  ApiProgressResponse,
  ApiWordListResponse,
  ApiWordResponse,
  ProgressAction,
  WordState,
} from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

/**
 * Typed API client for the vocab backend.
 *
 * - Injects auth token when available
 * - All methods are no-ops if not authenticated (guest mode uses local store)
 * - Used for syncing progress once the user logs in
 */
class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  get isAuthenticated(): boolean {
    return this.token !== null;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        (body as { error?: string }).error || `Request failed (${response.status})`,
        response.status
      );
    }

    return response.json() as Promise<T>;
  }

  // ---- Words ----

  async bulkAddWords(text: string): Promise<ApiBulkAddResponse> {
    return this.request('/api/words/bulk', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getWords(
    state?: WordState,
    cursor?: string,
    limit = 50
  ): Promise<ApiWordListResponse> {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    return this.request(`/api/words?${params.toString()}`);
  }

  async getWordDetail(wordId: number): Promise<ApiWordResponse> {
    return this.request(`/api/words/${wordId}`);
  }

  async updateProgress(
    wordId: number,
    action: ProgressAction
  ): Promise<ApiProgressResponse> {
    return this.request('/api/words/progress', {
      method: 'PUT',
      body: JSON.stringify({ wordId, action }),
    });
  }

  async bulkUpdateProgress(
    wordIds: number[],
    action: ProgressAction
  ): Promise<{ updated: ApiProgressResponse[] }> {
    return this.request('/api/words/bulk-progress', {
      method: 'PUT',
      body: JSON.stringify({ wordIds, action }),
    });
  }

  // ---- Collections ----

  async getCollections(): Promise<{ collections: Array<{ id: number; name: string; description: string | null }> }> {
    return this.request('/api/collections');
  }

  async cloneCollection(collectionId: number): Promise<{ message: string; clonedCount: number }> {
    return this.request(`/api/collections/${collectionId}/clone`, {
      method: 'POST',
    });
  }

  // ---- Auth ----

  async getSession(): Promise<{ user: { id: string; name: string; email: string; image?: string } } | null> {
    try {
      return await this.request('/api/auth/get-session');
    } catch {
      return null;
    }
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Singleton API client */
export const api = new ApiClient();

// ============================================
// Free Dictionary API (direct client-side calls for guest mode)
// ============================================

interface FreeDictEntry {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
    }>;
    synonyms?: string[];
  }>;
}

/**
 * Fetches a definition directly from the Free Dictionary API.
 * Used in guest mode (no backend needed).
 */
export async function fetchDefinitionDirect(word: string): Promise<{
  definition: string;
  synonyms: string | null;
  phonetic: string | null;
  example: string | null;
} | null> {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = (await response.json()) as FreeDictEntry[];
    const entry = data[0];
    if (!entry?.meanings?.length) return null;

    // Collect synonyms
    const allSynonyms = new Set<string>();
    for (const meaning of entry.meanings) {
      for (const syn of meaning.synonyms ?? []) allSynonyms.add(syn);
      for (const def of meaning.definitions) {
        for (const syn of def.synonyms ?? []) allSynonyms.add(syn);
      }
    }

    // Build rich definition
    const allDefinitions = entry.meanings
      .slice(0, 3)
      .map((m) => {
        const defs = m.definitions
          .slice(0, 2)
          .map((d) => d.definition)
          .join('; ');
        return `(${m.partOfSpeech}) ${defs}`;
      })
      .join('\n');

    const primaryDef = entry.meanings[0].definitions[0];

    return {
      definition: allDefinitions || primaryDef?.definition || 'No definition available.',
      synonyms: allSynonyms.size > 0 ? Array.from(allSynonyms).slice(0, 8).join(', ') : null,
      phonetic: entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || null,
      example: primaryDef?.example || null,
    };
  } catch {
    return null;
  }
}
