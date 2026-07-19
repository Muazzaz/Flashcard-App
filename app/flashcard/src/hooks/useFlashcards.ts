import { useCallback, useState } from 'react';
import { useWordStore } from '@/stores/wordStore';
import { fetchDefinitionDirect } from '@/services/api';
import type { Word, WordState, WordSection, ProgressAction } from '@/types';
import { groupWordsAlphabetically } from '@/types';

/**
 * Data hook for flashcard screens.
 * Bridges the Zustand store with UI-ready section data,
 * and handles lazy-loading definitions from the Free Dictionary API.
 */
export function useFlashcards(state: WordState) {
  const words = useWordStore((s) => s.getWordsByState(state));
  const count = useWordStore((s) => s.getCountByState(state));
  const updateWordState = useWordStore((s) => s.updateWordState);
  const bulkMarkAsMastered = useWordStore((s) => s.bulkMarkAsMastered);

  const sections: WordSection[] = groupWordsAlphabetically(words);

  return {
    words,
    sections,
    count,
    updateWordState,
    bulkMarkAsMastered,
  };
}

/**
 * Hook for loading a single word's details.
 * Lazy-loads the definition from the Free Dictionary API if missing.
 */
export function useWordDetail(wordId: string) {
  const word = useWordStore((s) => s.getWordById(wordId));
  const setWordDefinition = useWordStore((s) => s.setWordDefinition);
  const updateWordState = useWordStore((s) => s.updateWordState);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);

  const loadDefinition = useCallback(async () => {
    if (!word || word.definition) return;

    setIsLoadingDefinition(true);
    try {
      const result = await fetchDefinitionDirect(word.wordText);
      if (result) {
        setWordDefinition(
          wordId,
          result.definition,
          result.synonyms
        );
      }
    } catch {
      // Silently fail — the user can still see the word
    } finally {
      setIsLoadingDefinition(false);
    }
  }, [word?.wordText, word?.definition, wordId, setWordDefinition]);

  const handleAction = useCallback(
    (action: ProgressAction) => {
      updateWordState(wordId, action);
    },
    [wordId, updateWordState]
  );

  return {
    word,
    isLoadingDefinition,
    loadDefinition,
    handleAction,
  };
}
