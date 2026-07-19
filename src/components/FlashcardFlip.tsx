import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Pressable, useColorScheme, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { AppColors, Radii, Shadows } from '@/constants/theme';

interface FlashcardFlipProps {
  /** Content shown on the front of the card */
  front: React.ReactNode;
  /** Content shown on the back of the card */
  back: React.ReactNode;
  /** Called when the card flips */
  onFlip?: (isFlipped: boolean) => void;
  /** Additional style for the card container */
  style?: ViewStyle;
  /** Card height (default: 420) */
  height?: number;
}

/**
 * 3D flip card component using react-native-reanimated.
 *
 * Features:
 * - 60fps spring-based rotation on Y-axis
 * - Proper perspective transform for realistic 3D depth
 * - Front face hidden past 90°, back face visible after 90°
 * - Tap anywhere to flip
 * - Tactile spring physics (tuned damping/stiffness)
 */
export function FlashcardFlip({
  front,
  back,
  onFlip,
  style,
  height = 420,
}: FlashcardFlipProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [isFlipped, setIsFlipped] = useState(false);
  const rotateY = useSharedValue(0);

  const flip = useCallback(() => {
    const willBeFlipped = !isFlipped;
    setIsFlipped(willBeFlipped);

    rotateY.value = withSpring(willBeFlipped ? 180 : 0, {
      damping: 18,
      stiffness: 85,
      mass: 0.9,
      overshootClamping: false,
    });

    onFlip?.(willBeFlipped);
  }, [isFlipped, rotateY, onFlip]);

  // Front face: 0° → 180° (visible when < 90°)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 180], [0, 180]);
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotate}deg` },
      ],
      backfaceVisibility: 'hidden' as const,
      // Use opacity to ensure clean hide on Android (backfaceVisibility can be buggy)
      opacity: interpolate(
        rotateY.value,
        [0, 89.9, 90, 180],
        [1, 1, 0, 0]
      ),
    };
  });

  // Back face: starts at 180° → rotates to 360° (visible when > 90°)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 180], [180, 360]);
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotate}deg` },
      ],
      backfaceVisibility: 'hidden' as const,
      opacity: interpolate(
        rotateY.value,
        [0, 89.9, 90, 180],
        [0, 0, 1, 1]
      ),
    };
  });

  const cardBg = isDark ? AppColors.cardDark : AppColors.cardLight;

  return (
    <Pressable onPress={flip} style={[styles.wrapper, { height }, style]}>
      {/* Front Face */}
      <Animated.View
        style={[
          styles.card,
          { height, backgroundColor: cardBg },
          Shadows.lg,
          frontAnimatedStyle,
        ]}
      >
        {front}
      </Animated.View>

      {/* Back Face */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { height, backgroundColor: cardBg },
          Shadows.lg,
          backAnimatedStyle,
        ]}
      >
        {back}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: Radii.xl,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  cardBack: {
    // Back face is positioned on top but starts rotated 180°
  },
});
