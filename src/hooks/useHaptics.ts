import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback hook.
 * Wraps expo-haptics with semantic methods for the vocabulary app.
 * Silently no-ops on platforms that don't support haptics.
 */
export function useHaptics() {
  const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

  /** Light tap — used when selecting a word or tapping UI elements */
  const triggerSelection = () => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  /** Success notification — used when tapping "Remembered" */
  const triggerSuccess = () => {
    if (!isSupported) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  /** Warning/heavy impact — used when tapping "Forgot" */
  const triggerWarning = () => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  /** Medium impact — used when entering multi-select mode (long press) */
  const triggerLongPress = () => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  /** Soft tap — used for subtle interactions like toggling a checkbox */
  const triggerSoft = () => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  };

  return {
    triggerSelection,
    triggerSuccess,
    triggerWarning,
    triggerLongPress,
    triggerSoft,
  };
}
