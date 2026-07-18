import React, { useEffect } from 'react';
import { StyleSheet, Text, useColorScheme, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/stores/wordStore';
import { AppColors, Radii, Shadows, Typography } from '@/constants/theme';

const TOAST_COLORS = {
  success: { bg: AppColors.success, text: '#FFFFFF' },
  error: { bg: AppColors.danger, text: '#FFFFFF' },
  info: { bg: AppColors.primary, text: '#FFFFFF' },
} as const;

/**
 * Global toast notification component.
 *
 * Slides in from the top with spring physics,
 * auto-dismisses after 3 seconds.
 * Mount this once in the root layout.
 */
export function Toast() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { message, type, visible, hide } = useToastStore();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 120,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-120, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const colors = TOAST_COLORS[type];

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8 },
        animatedStyle,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable
        onPress={hide}
        style={[
          styles.toast,
          { backgroundColor: colors.bg },
          Shadows.md,
        ]}
      >
        <Text style={[styles.icon]}>
          {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </Text>
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    maxWidth: 500,
    width: '100%',
    gap: 10,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    width: 22,
    textAlign: 'center',
  },
  message: {
    ...Typography.subheadline,
    fontWeight: '500',
    flex: 1,
  },
});
