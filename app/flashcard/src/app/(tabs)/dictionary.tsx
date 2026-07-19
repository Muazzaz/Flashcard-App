import React, { useState } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFlashcards } from '@/hooks/useFlashcards';
import { WordList } from '@/components/WordList';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { AddWordsSheet } from '@/components/AddWordsSheet';
import { SelectionBar } from '@/components/SelectionBar';
import { Colors, AppColors, Typography, Spacing, StateTheme } from '@/constants/theme';

/**
 * Dictionary tab — displays NEW state words.
 *
 * Special features:
 * - Floating Action Button to open bulk-add sheet
 * - Multi-select mode (long-press) with SelectionBar
 * - Alphabetical list with sticky headers
 */
export default function DictionaryScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { sections, count } = useFlashcards('ALL');
  const [showAddSheet, setShowAddSheet] = useState(false);

  const header = (
    <View style={styles.header}>
      <View>
        <Text
          style={[
            styles.title,
            { color: isDark ? Colors.dark.text : Colors.light.text },
          ]}
        >
          Dictionary
        </Text>
        <Text style={[styles.subtitle, { color: AppColors.textMuted }]}>
          {count > 0
            ? `${count} word${count !== 1 ? 's' : ''} in dictionary`
            : 'Add words to get started'}
        </Text>
      </View>
      <View style={[styles.stateBadge, { backgroundColor: AppColors.primary + '20' }]}>
        <Text style={[styles.stateBadgeText, { color: AppColors.primary }]}>ALL ({count})</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
      ]}
    >
      <WordList
        sections={sections}
        state="ALL"
        ListHeaderComponent={header}
      />

      {/* FAB — opens the add words bottom sheet */}
      <FloatingActionButton onPress={() => setShowAddSheet(true)} />

      {/* Add Words Bottom Sheet */}
      <AddWordsSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      />

      {/* Multi-select toolbar */}
      <SelectionBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    ...Typography.largeTitle,
  },
  subtitle: {
    ...Typography.subheadline,
    marginTop: 4,
  },
  stateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stateBadgeText: {
    ...Typography.caption1,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
