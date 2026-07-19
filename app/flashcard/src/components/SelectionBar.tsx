import React from 'react';
import { StyleSheet, Text, View, Pressable, useColorScheme } from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useWordStore } from '@/stores/wordStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AppColors, Colors, Radii, Shadows, Typography } from '@/constants/theme';

/**
 * Multi-select floating toolbar.
 *
 * Slides up from the bottom when multi-select mode is active.
 * Shows selected count, "Mark as Mastered" action, and Cancel.
 */
export function SelectionBar() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { triggerSuccess, triggerWarning, triggerSelection } = useHaptics();

  const isMultiSelectMode = useWordStore((s) => s.isMultiSelectMode);
  const selectedIds = useWordStore((s) => s.selectedIds);
  const bulkMarkAsMastered = useWordStore((s) => s.bulkMarkAsMastered);
  const bulkDeleteWords = useWordStore((s) => s.bulkDeleteWords);
  const clearSelection = useWordStore((s) => s.clearSelection);

  if (!isMultiSelectMode) return null;

  const handleMastered = () => {
    if (selectedIds.length === 0) return;
    triggerSuccess();
    bulkMarkAsMastered(selectedIds);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    triggerWarning();
    bulkDeleteWords(selectedIds);
  };

  const handleCancel = () => {
    triggerSelection();
    clearSelection();
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18).stiffness(140)}
      exiting={SlideOutDown.duration(250)}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? AppColors.cardDark : AppColors.cardLight,
          borderTopColor: isDark ? AppColors.borderDark : AppColors.borderLight,
        },
        Shadows.lg,
      ]}
    >
      <Text style={[styles.count, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
        {selectedIds.length} selected
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: AppColors.textMuted }]}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={selectedIds.length === 0}
          style={[
            styles.deleteButton,
            {
              backgroundColor: selectedIds.length > 0 ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2') : 'transparent',
            },
          ]}
        >
          <Text style={[styles.deleteText, { color: selectedIds.length > 0 ? AppColors.danger : AppColors.textMuted }]}>
            🗑️ Delete
          </Text>
        </Pressable>

        <Pressable
          onPress={handleMastered}
          disabled={selectedIds.length === 0}
          style={[
            styles.masteredButton,
            {
              backgroundColor:
                selectedIds.length > 0
                  ? AppColors.stateMastered
                  : isDark
                    ? AppColors.borderDark
                    : AppColors.borderLight,
            },
          ]}
        >
          <Text style={styles.masteredText}>
            ★ Done
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 200,
  },
  count: {
    ...Typography.headline,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  cancelText: {
    ...Typography.callout,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.lg,
  },
  deleteText: {
    ...Typography.subheadline,
    fontWeight: '700',
  },
  masteredButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.lg,
  },
  masteredText: {
    ...Typography.subheadline,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
