import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { AppColors, Radii } from '@/constants/theme';

interface SkeletonLoaderProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated skeleton shimmer loader.
 * Pulses opacity to indicate loading content.
 * Uses Reanimated worklets for 60fps performance.
 */
export function SkeletonLoader({
  width,
  height,
  borderRadius = Radii.sm,
  style,
}: SkeletonLoaderProps) {
  const scheme = useColorScheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1, // infinite
      true // reverse (pulse effect)
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.25, 0.55]),
  }));

  const bgColor =
    scheme === 'dark' ? AppColors.cardDark : AppColors.borderLight;

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: bgColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Preset skeleton for a definition text block.
 */
export function DefinitionSkeleton() {
  return (
    <>
      <SkeletonLoader width="100%" height={16} style={styles.line} />
      <SkeletonLoader width="90%" height={16} style={styles.line} />
      <SkeletonLoader width="75%" height={16} style={styles.line} />
      <SkeletonLoader width="60%" height={14} style={styles.lineMuted} />
    </>
  );
}

/**
 * Preset skeleton for synonyms.
 */
export function SynonymsSkeleton() {
  return (
    <Animated.View style={styles.synonymsRow}>
      <SkeletonLoader width={60} height={26} borderRadius={Radii.full} />
      <SkeletonLoader width={80} height={26} borderRadius={Radii.full} />
      <SkeletonLoader width={55} height={26} borderRadius={Radii.full} />
      <SkeletonLoader width={70} height={26} borderRadius={Radii.full} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  line: {
    marginBottom: 8,
  },
  lineMuted: {
    marginBottom: 12,
    marginTop: 4,
  },
  synonymsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
});
