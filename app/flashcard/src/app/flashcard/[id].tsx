import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWordDetail } from '@/hooks/useFlashcards';
import { useHaptics } from '@/hooks/useHaptics';
import { FlashcardFlip } from '@/components/FlashcardFlip';
import { ActionButtons } from '@/components/ActionButtons';
import { DefinitionSkeleton, SynonymsSkeleton } from '@/components/SkeletonLoader';
import { AppColors, Colors, Radii, Shadows, Spacing, StateTheme, Typography } from '@/constants/theme';

/**
 * Flashcard detail screen — presented as a modal.
 *
 * Features:
 * - 3D flip card (tap to flip)
 * - Front: word text + phonetic
 * - Back: definition + synonyms + example (lazy-loaded)
 * - Remembered / Forgot / Reset action buttons
 * - State badge showing current state
 */
export default function FlashcardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { triggerSelection } = useHaptics();

  const { word, isLoadingDefinition, loadDefinition, handleAction } = useWordDetail(id!);

  // Lazy-load definition when screen opens
  useEffect(() => {
    loadDefinition();
  }, [loadDefinition]);

  const handleRemembered = useCallback(() => {
    handleAction('remembered');
    // Small delay so the user sees the haptic, then dismiss
    setTimeout(() => router.back(), 200);
  }, [handleAction, router]);

  const handleForgot = useCallback(() => {
    handleAction('forgot');
    setTimeout(() => router.back(), 200);
  }, [handleAction, router]);

  const handleReset = useCallback(() => {
    handleAction('reset');
  }, [handleAction]);

  if (!word) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
        ]}
      >
        <Text style={[styles.notFound, { color: AppColors.textMuted }]}>
          Word not found
        </Text>
      </SafeAreaView>
    );
  }

  const stateTheme = StateTheme[word.currentState];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            triggerSelection();
            router.back();
          }}
          style={styles.closeButton}
        >
          <Text style={[styles.closeIcon, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
            ✕
          </Text>
        </Pressable>

        <View style={[styles.statePill, { backgroundColor: stateTheme.lightBg }]}>
          <Text style={[styles.statePillText, { color: stateTheme.color }]}>
            {stateTheme.label}
          </Text>
        </View>

        <Text style={styles.tapHint}>tap card to flip</Text>
      </View>

      {/* Flip Card */}
      <View style={styles.cardWrapper}>
        <FlashcardFlip
          height={440}
          front={<CardFront word={word} isDark={isDark} />}
          back={
            <CardBack
              word={word}
              isDark={isDark}
              isLoading={isLoadingDefinition}
            />
          }
        />
      </View>

      {/* Action Buttons */}
      <ActionButtons
        onRemembered={handleRemembered}
        onForgot={handleForgot}
        onReset={handleReset}
        showReset={word.currentState !== 'NEW'}
      />
    </SafeAreaView>
  );
}

// ============================================
// Card Front Face
// ============================================

function CardFront({ word, isDark }: { word: NonNullable<ReturnType<typeof useWordDetail>['word']>; isDark: boolean }) {
  return (
    <View style={styles.cardContent}>
      <Text
        style={[
          styles.wordMain,
          { color: isDark ? Colors.dark.text : Colors.light.text },
        ]}
      >
        {word.wordText}
      </Text>

      {word.banglaMeaning ? (
        <View style={[styles.banglaPill, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF' }]}>
          <Text style={[styles.banglaPillText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
            🇧🇩 {word.banglaMeaning}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.flipHint, { color: AppColors.textMuted }]}>
        tap to reveal definition
      </Text>
    </View>
  );
}

// ============================================
// Card Back Face
// ============================================

function CardBack({
  word,
  isDark,
  isLoading,
}: {
  word: NonNullable<ReturnType<typeof useWordDetail>['word']>;
  isDark: boolean;
  isLoading: boolean;
}) {
  if (isLoading || (!word.definition && !word.banglaMeaning)) {
    return (
      <ScrollView
        style={styles.cardScrollContent}
        contentContainerStyle={styles.cardContentPadded}
        showsVerticalScrollIndicator={true}
      >
        <Text
          style={[
            styles.wordSmall,
            { color: isDark ? Colors.dark.text : Colors.light.text },
          ]}
        >
          {word.wordText}
        </Text>
        <View style={styles.divider} />
        <DefinitionSkeleton />
        <View style={{ height: 16 }} />
        <SynonymsSkeleton />
      </ScrollView>
    );
  }

  // Parse definition lines (format: "(partOfSpeech) definition")
  const defLines = word.definition ? word.definition.split('\n').filter((l) => l.trim()) : [];
  const synonymList = word.synonyms?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <ScrollView
      style={styles.cardScrollContent}
      contentContainerStyle={styles.cardContentPadded}
      showsVerticalScrollIndicator={true}
    >
      {/* Word (smaller on back) */}
      <Text
        style={[
          styles.wordSmall,
          { color: isDark ? Colors.dark.text : Colors.light.text },
        ]}
      >
        {word.wordText}
      </Text>

      {/* Bangla Meaning Box */}
      {word.banglaMeaning ? (
        <View style={[styles.banglaBox, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF' }]}>
          <Text style={styles.banglaBoxLabel}>🇧🇩 বাংলা অর্থ (Bangla Meaning)</Text>
          <Text style={[styles.banglaBoxText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
            {word.banglaMeaning}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* English Definitions */}
      {defLines.map((line, i) => {
        // Extract part of speech if present: "(noun) definition text"
        const match = line.match(/^\(([^)]+)\)\s*(.*)/);
        return (
          <View key={i} style={styles.defLine}>
            {match ? (
              <>
                <Text style={[styles.partOfSpeech, { color: AppColors.primary }]}>
                  {match[1]}
                </Text>
                <Text
                  style={[
                    styles.defText,
                    { color: isDark ? Colors.dark.text : Colors.light.text },
                  ]}
                >
                  {match[2]}
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.defText,
                  { color: isDark ? Colors.dark.text : Colors.light.text },
                ]}
              >
                {line}
              </Text>
            )}
          </View>
        );
      })}

      {/* Synonyms */}
      {synonymList.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: AppColors.textMuted }]}>
            Synonyms
          </Text>
          <View style={styles.synonymsRow}>
            {synonymList.map((syn, i) => (
              <View
                key={i}
                style={[
                  styles.synonymPill,
                  {
                    backgroundColor: isDark
                      ? AppColors.borderDark
                      : AppColors.surfaceLight,
                    borderColor: isDark
                      ? AppColors.borderDark
                      : AppColors.borderLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.synonymText,
                    { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary },
                  ]}
                >
                  {syn}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banglaPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    marginVertical: 4,
  },
  banglaPillText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '700',
  },
  banglaBox: {
    padding: 12,
    borderRadius: Radii.md,
    marginVertical: 8,
  },
  banglaBoxLabel: {
    ...Typography.caption2,
    fontWeight: '700',
    color: AppColors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  banglaBoxText: {
    ...Typography.headline,
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  statePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  statePillText: {
    ...Typography.caption1,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tapHint: {
    ...Typography.caption2,
    color: AppColors.textMuted,
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 16,
  },
  cardScrollContent: {
    flex: 1,
    width: '100%',
  },
  cardContentPadded: {
    paddingTop: 4,
    paddingBottom: 32,
  },
  wordMain: {
    ...Typography.largeTitle,
    fontSize: 38,
    fontWeight: '800',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  wordSmall: {
    ...Typography.title2,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  flipHint: {
    ...Typography.caption1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.borderLight,
    marginVertical: 12,
  },
  defLine: {
    marginBottom: 10,
  },
  partOfSpeech: {
    ...Typography.caption1,
    fontWeight: '700',
    fontStyle: 'italic',
    textTransform: 'capitalize',
    marginBottom: 3,
  },
  defText: {
    ...Typography.body,
    lineHeight: 24,
  },
  sectionLabel: {
    ...Typography.caption1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  synonymsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  synonymText: {
    ...Typography.footnote,
    fontWeight: '500',
  },
  notFound: {
    ...Typography.headline,
    textAlign: 'center',
    marginTop: 100,
  },
});
