import React, { useEffect } from 'react';
import { StyleSheet, Text, Pressable, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { AppColors, Radii, Shadows, Typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FloatingActionButtonProps {
  onPress: () => void;
  /** Bottom offset (to clear tab bar) */
  bottomOffset?: number;
}

/**
 * Floating Action Button for the Dictionary tab.
 *
 * - Primary-colored round button with "+" icon
 * - Spring scale-up entrance animation
 * - Press animation with spring physics
 * - Colored shadow for depth
 */
export function FloatingActionButton({
  onPress,
  bottomOffset = 100,
}: FloatingActionButtonProps) {
  const { triggerSelection } = useHaptics();
  const scheme = useColorScheme();

  // Entrance animation
  const scale = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      300,
      withSpring(1, { damping: 12, stiffness: 150, mass: 0.6 })
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pressScale.value },
    ],
  }));

  const handlePress = () => {
    triggerSelection();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        pressScale.value = withSpring(0.88, { damping: 12, stiffness: 200 });
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      style={[
        styles.fab,
        { bottom: bottomOffset },
        Shadows.colored(AppColors.primary),
        animatedStyle,
      ]}
    >
      <Text style={styles.icon}>+</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -1,
  },
});
