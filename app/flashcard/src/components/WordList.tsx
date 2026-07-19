import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, SectionList, useColorScheme } from 'react-native';
import { AlphabetHeader } from './AlphabetHeader';
import { FlashcardItem } from './FlashcardItem';
import { AppColors, Colors, Spacing, Typography } from '@/constants/theme';
import type { Word, WordSection, WordState } from '@/types';
import { StateTheme } from '@/constants/theme';

interface WordListProps {
  sections: WordSection[];
  state: WordState | 'ALL';
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
}

/**
 * Alphabetically grouped word list with sticky section headers.
 * Uses SectionList for native sticky header support.
 * Includes empty state illustration.
 */
export function WordList({
  sections,
  state,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
}: WordListProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme =
    state === 'ALL'
      ? { color: AppColors.primary, lightBg: AppColors.primary + '20' }
      : StateTheme[state];

  const renderSectionHeader = useCallback(
    ({ section }: { section: WordSection }) => (
      <AlphabetHeader letter={section.letter} count={section.data.length} />
    ),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Word; index: number }) => (
      <FlashcardItem word={item} index={index} />
    ),
    []
  );

  const keyExtractor = useCallback((item: Word) => item.id, []);

  const totalWords = useMemo(
    () => sections.reduce((sum, s) => sum + s.data.length, 0),
    [sections]
  );

  if (totalWords === 0) {
    return (
      <View style={styles.emptyContainer}>
        {ListHeaderComponent}
        <EmptyState state={state} isDark={isDark} theme={theme} />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListHeaderComponent={ListHeaderComponent}
      ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
      SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
      initialNumToRender={20}
      maxToRenderPerBatch={15}
      windowSize={5}
    />
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState({
  state,
  isDark,
  theme,
}: {
  state: WordState | 'ALL';
  isDark: boolean;
  theme: { color: string; lightBg: string };
}) {
  const messages: Record<
    WordState | 'ALL',
    { title: string; subtitle: string; emoji: string }
  > = {
    ALL: {
      title: 'Your dictionary is empty',
      subtitle: 'Tap the + button to add words\nand start building your vocabulary',
      emoji: '📖',
    },
    NEW: {
      title: 'No new words',
      subtitle: 'Words marked as NEW will show up here',
      emoji: '✨',
    },
    LEARNING: {
      title: 'Nothing here yet',
      subtitle: "Words you're actively studying\nwill appear here",
      emoji: '📝',
    },
    REVIEWING: {
      title: 'No words to review',
      subtitle: 'Words ready for review\nwill show up here',
      emoji: '🔄',
    },
    MASTERED: {
      title: 'No mastered words yet',
      subtitle: 'Words you\'ve conquered will\nappear here — keep going!',
      emoji: '⭐',
    },
  };

  const msg = messages[state];

  return (
    <View style={styles.emptyContent}>
      <View style={[styles.emojiCircle, { backgroundColor: theme.lightBg }]}>
        <Text style={styles.emoji}>{msg.emoji}</Text>
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: isDark ? Colors.dark.text : Colors.light.text },
        ]}
      >
        {msg.title}
      </Text>
      <Text style={[styles.emptySubtitle, { color: AppColors.textMuted }]}>
        {msg.subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 120, // Space for FAB + tab bar
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emojiCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 40,
  },
  emptyTitle: {
    ...Typography.title3,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.subheadline,
    textAlign: 'center',
    lineHeight: 22,
  },
});
