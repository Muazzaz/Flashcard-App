import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Word,
  type WordState,
  type ProgressAction,
  computeNextState,
  generateLocalId,
} from '@/types';
import { api } from '@/services/api';

// ============================================
// Toast Store (lightweight, separate concern)
// ============================================

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  show: (message: string, type?: 'success' | 'error' | 'info') => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  show: (message, type = 'info') => {
    set({ message, type, visible: true });
    // Auto-hide after 3 seconds
    setTimeout(() => set({ visible: false }), 3000);
  },
  hide: () => set({ visible: false }),
}));

// ============================================
// Word Store — local-first with optional sync
// ============================================

interface WordStore {
  // ---- Data ----
  words: Word[];

  // ---- Selection (multi-select mode) ----
  selectedIds: string[];
  isMultiSelectMode: boolean;

  // ---- Auth ----
  authToken: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;

  // ---- Word Actions ----
  addWords: (texts: string[]) => void;
  updateWordState: (wordId: string, action: ProgressAction) => void;
  bulkMarkAsMastered: (wordIds: string[]) => void;
  setWordDefinition: (
    wordId: string,
    definition: string,
    synonyms: string | null,
    banglaMeaning?: string | null
  ) => void;
  removeWord: (wordId: string) => void;
  bulkDeleteWords: (wordIds: string[]) => void;

  // ---- Selection Actions ----
  toggleSelectWord: (wordId: string) => void;
  setMultiSelectMode: (active: boolean) => void;
  clearSelection: () => void;
  selectAll: (state?: WordState | 'ALL') => void;

  // ---- Auth Actions ----
  setAuth: (token: string, user: { id: string; name: string; email: string; image?: string }) => void;
  clearAuth: () => void;

  // ---- Computed Getters ----
  getWordsByState: (state?: WordState | 'ALL') => Word[];
  getWordById: (id: string) => Word | undefined;
  getCountByState: (state: WordState) => number;
}

export const useWordStore = create<WordStore>()(
  persist(
    (set, get) => ({
      // ---- Initial State ----
      words: [],
      selectedIds: [],
      isMultiSelectMode: false,
      authToken: null,
      userId: null,
      userName: null,
      userEmail: null,
      userImage: null,

      // ---- Word Actions ----

      addWords: (texts: string[]) => {
        const existing = new Set(get().words.map((w) => w.wordText.toLowerCase()));

        const newWords: Word[] = texts
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0 && t.length <= 100)
          .filter((t) => /^[a-z][a-z'\-\s]*$/.test(t))
          .filter((t) => !existing.has(t))
          .map((wordText) => ({
            id: generateLocalId(),
            wordText,
            definition: null,
            synonyms: null,
            imageUrl: null,
            currentState: 'NEW' as WordState,
            createdAt: new Date().toISOString(),
          }));

        // Deduplicate within the batch
        const seen = new Set<string>();
        const deduplicated = newWords.filter((w) => {
          if (seen.has(w.wordText)) return false;
          seen.add(w.wordText);
          return true;
        });

        set((state) => ({ words: [...state.words, ...deduplicated] }));

        // Fire-and-forget backend sync if authenticated
        if (api.isAuthenticated) {
          api.bulkAddWords(deduplicated.map((w) => w.wordText).join(',')).catch(() => {
            useToastStore.getState().show('Failed to sync new words', 'error');
          });
        }

        const addedCount = deduplicated.length;
        if (addedCount > 0) {
          useToastStore.getState().show(
            `Added ${addedCount} word${addedCount > 1 ? 's' : ''} to Dictionary`,
            'success'
          );
        }
      },

      updateWordState: (wordId: string, action: ProgressAction) => {
        const word = get().words.find((w) => w.id === wordId);
        if (!word) return;

        const newState = computeNextState(word.currentState, action);

        // Optimistic update
        set((state) => ({
          words: state.words.map((w) =>
            w.id === wordId ? { ...w, currentState: newState } : w
          ),
        }));

        // Background sync if authenticated
        if (api.isAuthenticated && !wordId.startsWith('local_')) {
          api.updateProgress(parseInt(wordId), action).catch(() => {
            // Rollback on failure
            set((state) => ({
              words: state.words.map((w) =>
                w.id === wordId ? { ...w, currentState: word.currentState } : w
              ),
            }));
            useToastStore.getState().show('Failed to update — reverted', 'error');
          });
        }
      },

      bulkMarkAsMastered: (wordIds: string[]) => {
        // Optimistic update — fast-track all to MASTERED
        set((state) => ({
          words: state.words.map((w) =>
            wordIds.includes(w.id)
              ? { ...w, currentState: 'MASTERED' as WordState }
              : w
          ),
          selectedIds: [],
          isMultiSelectMode: false,
        }));

        // Background sync
        if (api.isAuthenticated) {
          const numericIds = wordIds
            .filter((id) => !id.startsWith('local_'))
            .map((id) => parseInt(id));
          if (numericIds.length > 0) {
            api.bulkUpdateProgress(numericIds, 'remembered').catch(() => {
              useToastStore.getState().show('Failed to sync bulk update', 'error');
            });
          }
        }
      },

      setWordDefinition: (
        wordId: string,
        definition: string,
        synonyms: string | null,
        banglaMeaning?: string | null
      ) => {
        set((state) => ({
          words: state.words.map((w) =>
            w.id === wordId ? { ...w, definition, synonyms, banglaMeaning } : w
          ),
        }));
      },

      removeWord: (wordId: string) => {
        set((state) => ({
          words: state.words.filter((w) => w.id !== wordId),
          selectedIds: state.selectedIds.filter((id) => id !== wordId),
        }));
      },

      bulkDeleteWords: (wordIds: string[]) => {
        set((state) => ({
          words: state.words.filter((w) => !wordIds.includes(w.id)),
          selectedIds: [],
          isMultiSelectMode: false,
        }));
      },

      // ---- Selection Actions ----

      toggleSelectWord: (wordId: string) => {
        set((state) => {
          const isSelected = state.selectedIds.includes(wordId);
          return {
            selectedIds: isSelected
              ? state.selectedIds.filter((id) => id !== wordId)
              : [...state.selectedIds, wordId],
          };
        });
      },

      setMultiSelectMode: (active: boolean) => {
        set({ isMultiSelectMode: active, selectedIds: active ? [] : [] });
      },

      clearSelection: () => {
        set({ selectedIds: [], isMultiSelectMode: false });
      },

      selectAll: (state?: WordState | 'ALL') => {
        const ids = get()
          .words.filter((w) => !state || state === 'ALL' || w.currentState === state)
          .map((w) => w.id);
        set({ selectedIds: ids });
      },

      // ---- Auth Actions ----

      setAuth: (token, user) => {
        api.setToken(token);
        set({
          authToken: token,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userImage: user.image ?? null,
        });
      },

      clearAuth: () => {
        api.setToken(null);
        set({
          authToken: null,
          userId: null,
          userName: null,
          userEmail: null,
          userImage: null,
        });
      },

      // ---- Computed Getters ----

      getWordsByState: (state?: WordState | 'ALL') => {
        return get()
          .words.filter((w) => !state || state === 'ALL' || w.currentState === state)
          .sort((a, b) => a.wordText.localeCompare(b.wordText));
      },

      getWordById: (id: string) => {
        return get().words.find((w) => w.id === id);
      },

      getCountByState: (state: WordState) => {
        return get().words.filter((w) => w.currentState === state).length;
      },
    }),
    {
      name: 'vocab-word-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields (not selection state)
      partialize: (state) => ({
        words: state.words,
        authToken: state.authToken,
        userId: state.userId,
        userName: state.userName,
        userEmail: state.userEmail,
        userImage: state.userImage,
      }),
    }
  )
);
