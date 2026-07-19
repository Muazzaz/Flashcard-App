import React, { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, useColorScheme } from 'react-native';
import Animated, {
  FadeIn,
  FadeOutLeft,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useWordStore } from '@/stores/wordStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AppColors, Colors, Radii, Shadows, Spacing, StateTheme, Typography } from '@/constants/theme';
import type { Word } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FlashcardItemProps {
  word: Word;
  index: number;
}

/**
 * Individual word list item with:
 * - Tap to open flashcard detail
 * - Long-press to enter multi-select mode
 * - Checkbox in multi-select mode
 * - State color indicator
 * - Smooth exit animation when state changes
 */
export function FlashcardItem({ word, index }: FlashcardItemProps) {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { triggerSelection, triggerLongPress, triggerSoft } = useHaptics();

  const isMultiSelectMode = useWordStore((s) => s.isMultiSelectMode);
  const selectedIds = useWordStore((s) => s.selectedIds);
  const toggleSelectWord = useWordStore((s) => s.toggleSelectWord);
  const setMultiSelectMode = useWordStore((s) => s.setMultiSelectMode);

  const isSelected = selectedIds.includes(word.id);
  const stateTheme = StateTheme[word.currentState];

  // Press scale animation
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (isMultiSelectMode) {
      triggerSoft();
      toggleSelectWord(word.id);
    } else {
      triggerSelection();
      router.push(`/flashcard/${word.id}` as any);
    }
  }, [isMultiSelectMode, word.id, router, triggerSelection, triggerSoft, toggleSelectWord]);

  const handleLongPress = useCallback(() => {
    if (!isMultiSelectMode) {
      triggerLongPress();
      setMultiSelectMode(true);
      toggleSelectWord(word.id);
    }
  }, [isMultiSelectMode, word.id, triggerLongPress, setMultiSelectMode, toggleSelectWord]);

  return (
    <AnimatedPressable
      entering={FadeIn.delay(index * 30).duration(250)}
      exiting={FadeOutLeft.duration(300)}
      layout={LinearTransition.springify().damping(18).stiffness(120)}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      style={[
        styles.container,
        scaleStyle,
        {
          backgroundColor: isDark ? AppColors.cardDark : AppColors.cardLight,
          borderColor: isSelected
            ? stateTheme.color
            : isDark
              ? AppColors.borderDark
              : AppColors.borderLight,
          borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
        },
        Shadows.sm,
      ]}
    >
      {/* State color indicator bar */}
      <View style={[styles.stateBar, { backgroundColor: stateTheme.color }]} />

      {/* Multi-select checkbox */}
      {isMultiSelectMode && (
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: isSelected ? stateTheme.color : 'transparent',
              borderColor: isSelected
                ? stateTheme.color
                : AppColors.textMuted,
            },
          ]}
        >
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}

      {/* Word content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.wordText,
            { color: isDark ? Colors.dark.text : Colors.light.text },
          ]}
          numberOfLines={1}
        >
          {word.wordText}
        </Text>

        {word.definition && (
          <Text
            style={[styles.preview, { color: AppColors.textMuted }]}
            numberOfLines={1}
          >
            {word.definition.split('\n')[0].replace(/^\([^)]+\)\s*/, '')}
          </Text>
        )}
      </View>

      {/* State badge */}
      {!isMultiSelectMode && (
        <View style={[styles.badge, { backgroundColor: stateTheme.lightBg }]}>
          <Text style={[styles.badgeText, { color: stateTheme.color }]}>
            {word.currentState === 'NEW'
              ? '●'
              : word.currentState === 'MASTERED'
                ? '★'
                : word.currentState === 'LEARNING'
                  ? '◐'
                  : '◑'}
          </Text>
        </View>
      )}

      {/* Chevron */}
      {!isMultiSelectMode && (
        <Text style={[styles.chevron, { color: AppColors.textMuted }]}>›</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: Radii.md,
    overflow: 'hidden',
    minHeight: 62,
  },
  stateBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 2,
  },
  wordText: {
    ...Typography.headline,
    textTransform: 'capitalize',
  },
  preview: {
    ...Typography.caption1,
    fontWeight: '400',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    paddingRight: 12,
    paddingLeft: 4,
  },
});
