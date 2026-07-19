import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWordStore, useToastStore } from '@/stores/wordStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AppColors, Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface AddWordsSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet modal for bulk-adding words.
 *
 * - Multi-line TextInput for comma/newline separated words
 * - Live word count
 * - Spring animation for open/close
 * - Backdrop press to dismiss
 */
export function AddWordsSheet({ visible, onClose }: AddWordsSheetProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { triggerSelection, triggerSuccess } = useHaptics();
  const addWords = useWordStore((s) => s.addWords);

  const [text, setText] = useState('');
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Parse word count from text
  const wordCount = text
    .split(/[,\n;]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0).length;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 22,
        stiffness: 120,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 280 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSubmit = useCallback(() => {
    const words = text
      .split(/[,\n;]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (words.length === 0) return;

    triggerSuccess();
    addWords(words);
    setText('');
    onClose();
  }, [text, addWords, onClose, triggerSuccess]);

  const handleClose = useCallback(() => {
    triggerSelection();
    onClose();
  }, [onClose, triggerSelection]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark
                ? AppColors.cardDark
                : AppColors.cardLight,
              paddingBottom: insets.bottom + 16,
            },
            Shadows.xl,
            sheetStyle,
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                {
                  backgroundColor: isDark
                    ? AppColors.borderDark
                    : AppColors.borderLight,
                },
              ]}
            />
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: isDark ? Colors.dark.text : Colors.light.text },
              ]}
            >
              Add Words
            </Text>
            <Pressable onPress={handleClose}>
              <Text style={[styles.cancelText, { color: AppColors.primary }]}>
                Cancel
              </Text>
            </Pressable>
          </View>

          {/* Text Input */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark
                  ? AppColors.surfaceDark
                  : AppColors.surfaceLight,
                borderColor: isDark
                  ? AppColors.borderDark
                  : AppColors.borderLight,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                { color: isDark ? Colors.dark.text : Colors.light.text },
              ]}
              placeholder="Enter words separated by commas or new lines..."
              placeholderTextColor={AppColors.textMuted}
              multiline
              numberOfLines={6}
              value={text}
              onChangeText={setText}
              autoFocus
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Word count + Submit */}
          <View style={styles.footer}>
            <Text style={[styles.wordCount, { color: AppColors.textMuted }]}>
              {wordCount} word{wordCount !== 1 ? 's' : ''} detected
            </Text>

            <Pressable
              onPress={handleSubmit}
              disabled={wordCount === 0}
              style={[
                styles.submitButton,
                {
                  backgroundColor:
                    wordCount > 0
                      ? AppColors.primary
                      : isDark
                        ? AppColors.borderDark
                        : AppColors.borderLight,
                },
                wordCount > 0 && Shadows.colored(AppColors.primary),
              ]}
            >
              <Text
                style={[
                  styles.submitText,
                  {
                    color:
                      wordCount > 0 ? '#FFFFFF' : AppColors.textMuted,
                  },
                ]}
              >
                Add {wordCount > 0 ? `${wordCount} ` : ''}Word{wordCount !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: AppColors.overlay,
  },
  sheet: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    ...Typography.title2,
  },
  cancelText: {
    ...Typography.callout,
    fontWeight: '600',
  },
  inputContainer: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  textInput: {
    ...Typography.body,
    padding: 16,
    minHeight: 150,
    maxHeight: 250,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  wordCount: {
    ...Typography.footnote,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radii.lg,
  },
  submitText: {
    ...Typography.headline,
    fontWeight: '700',
  },
});
