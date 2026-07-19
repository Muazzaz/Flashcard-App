import React, { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { AppColors, Radii, Shadows, Typography } from '@/constants/theme';
import type { ProgressAction } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonsProps {
  onRemembered: () => void;
  onForgot: () => void;
  onReset: () => void;
  onDelete?: () => void;
  /** If true, show the Reset button */
  showReset?: boolean;
}

/**
 * Action button bar for the flashcard detail screen.
 *
 * - "Forgot" (rose/red) on the left — triggers heavy haptic
 * - "Remembered" (emerald/green) on the right — triggers success haptic
 * - "Reset to New" and "Delete Word" discreet buttons below
 */
export function ActionButtons({
  onRemembered,
  onForgot,
  onReset,
  onDelete,
  showReset = true,
}: ActionButtonsProps) {
  const { triggerSuccess, triggerWarning, triggerSelection } = useHaptics();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const handleRemembered = useCallback(() => {
    triggerSuccess();
    onRemembered();
  }, [triggerSuccess, onRemembered]);

  const handleForgot = useCallback(() => {
    triggerWarning();
    onForgot();
  }, [triggerWarning, onForgot]);

  const handleReset = useCallback(() => {
    triggerSelection();
    onReset();
  }, [triggerSelection, onReset]);

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        <ActionButton
          label="Forgot"
          emoji="✕"
          backgroundColor={isDark ? '#5C1A2A' : AppColors.dangerLight}
          textColor={AppColors.danger}
          onPress={handleForgot}
          style={styles.buttonFlex}
        />
        <ActionButton
          label="Remembered"
          emoji="✓"
          backgroundColor={isDark ? '#1A3A2A' : AppColors.successLight}
          textColor={AppColors.success}
          onPress={handleRemembered}
          style={styles.buttonFlex}
        />
      </View>

      <View style={styles.secondaryRow}>
        {showReset && (
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Text style={[styles.resetText, { color: AppColors.textMuted }]}>
              Reset to New
            </Text>
          </Pressable>
        )}

        {onDelete && (
          <Pressable
            onPress={() => {
              triggerWarning();
              onDelete();
            }}
            style={styles.resetButton}
          >
            <Text style={[styles.resetText, { color: isDark ? '#F87171' : '#EF4444' }]}>
              🗑️ Delete Word
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ============================================
// Individual Action Button
// ============================================

function ActionButton({
  label,
  emoji,
  backgroundColor,
  textColor,
  onPress,
  style,
}: {
  label: string;
  emoji: string;
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
  style?: object;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 12, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      style={[styles.actionButton, { backgroundColor }, Shadows.sm, animatedStyle, style]}
    >
      <Text style={[styles.actionEmoji, { color: textColor }]}>{emoji}</Text>
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  buttonFlex: {
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Radii.lg,
    gap: 8,
  },
  actionEmoji: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionLabel: {
    ...Typography.headline,
    fontWeight: '700',
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetText: {
    ...Typography.footnote,
    fontWeight: '500',
  },
});
