import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { AppColors, Colors, Radii, Typography } from '@/constants/theme';

interface AlphabetHeaderProps {
  letter: string;
  count: number;
}

/**
 * Sticky section header for alphabetical word lists.
 * Shows the letter and word count for that section.
 */
export function AlphabetHeader({ letter, count }: AlphabetHeaderProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(11, 15, 26, 0.92)'
            : 'rgba(248, 250, 252, 0.92)',
          borderBottomColor: isDark
            ? AppColors.borderDark
            : AppColors.borderLight,
        },
      ]}
    >
      <Text
        style={[
          styles.letter,
          { color: isDark ? Colors.dark.text : Colors.light.text },
        ]}
      >
        {letter}
      </Text>
      <Text
        style={[
          styles.count,
          { color: AppColors.textMuted },
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  letter: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  count: {
    ...Typography.caption1,
    fontWeight: '500',
  },
});
