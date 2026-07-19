import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFlashcards } from '@/hooks/useFlashcards';
import { WordList } from '@/components/WordList';
import { Colors, AppColors, Typography, StateTheme } from '@/constants/theme';

/**
 * Reviewing tab — displays REVIEWING state words.
 * Words arrive here after being "Remembered" from LEARNING.
 * One more "Remembered" promotes them to MASTERED.
 */
export default function ReviewingScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { sections, count } = useFlashcards('ALL');

  const header = (
    <View style={styles.header}>
      <View>
        <Text
          style={[
            styles.title,
            { color: isDark ? Colors.dark.text : Colors.light.text },
          ]}
        >
          Reviewing
        </Text>
        <Text style={[styles.subtitle, { color: AppColors.textMuted }]}>
          {count > 0
            ? `${count} word${count !== 1 ? 's' : ''} in dictionary`
            : 'Add words to get started'}
        </Text>
      </View>
      <View style={[styles.stateBadge, { backgroundColor: StateTheme.REVIEWING.lightBg }]}>
        <Text style={[styles.stateBadgeText, { color: StateTheme.REVIEWING.color }]}>
          REVIEW
        </Text>
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
