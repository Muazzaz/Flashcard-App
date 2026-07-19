/**
 * Dictionary service using the Free Dictionary API (dictionaryapi.dev).
 * Completely free, no API key required.
 *
 * This follows the lazy-load pattern: only called when a word's
 * definition or synonyms are null (on first view).
 */

export interface DictionaryResult {
  definition: string;
  synonyms: string | null;
  partOfSpeech: string | null;
  example: string | null;
  phonetic: string | null;
}

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
 * Fetches a word's definition from the Free Dictionary API.
 * Returns null if the word is not found or the API is unreachable.
 */
export async function fetchDefinition(
  word: string
): Promise<DictionaryResult | null> {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`;
    const response = await fetch(url);

    if (!response.ok) {
      // 404 = word not found, other codes = API error
      return null;
    }

    const data = (await response.json()) as FreeDictEntry[];
    const entry = data[0];
    if (!entry || !entry.meanings || entry.meanings.length === 0) {
      return null;
    }

    // Extract the best definition (first meaning, first definition)
    const primaryMeaning = entry.meanings[0];
    const primaryDef = primaryMeaning.definitions[0];

    // Collect all synonyms from all meanings (deduplicated, max 8)
    const allSynonyms = new Set<string>();
    for (const meaning of entry.meanings) {
      if (meaning.synonyms) {
        for (const syn of meaning.synonyms) {
          allSynonyms.add(syn);
        }
      }
      for (const def of meaning.definitions) {
        if (def.synonyms) {
          for (const syn of def.synonyms) {
            allSynonyms.add(syn);
          }
        }
      }
    }

    // Build a rich, multi-meaning definition string
    const allDefinitions = entry.meanings
      .slice(0, 3) // Max 3 parts of speech
      .map((m) => {
        const defs = m.definitions
          .slice(0, 2) // Max 2 definitions per part of speech
          .map((d) => d.definition)
          .join('; ');
        return `(${m.partOfSpeech}) ${defs}`;
      })
      .join('\n');

    return {
      definition: allDefinitions || primaryDef?.definition || 'No definition available.',
      synonyms:
        allSynonyms.size > 0
          ? Array.from(allSynonyms).slice(0, 8).join(', ')
          : null,
      partOfSpeech: primaryMeaning.partOfSpeech || null,
      example: primaryDef?.example || null,
      phonetic:
        entry.phonetic ||
        entry.phonetics?.find((p) => p.text)?.text ||
        null,
    };
  } catch (error) {
    console.error(`Dictionary API error for "${word}":`, error);
    return null;
  }
}
