import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import { useWordStore } from '@/stores/wordStore';
import { AppColors, StateTheme, Typography } from '@/constants/theme';
import type { WordState } from '@/types';

/**
 * Tab icon component using Unicode symbols for cross-platform reliability.
 */
function TabIcon({ state, focused }: { state: WordState; focused: boolean }) {
  const theme = StateTheme[state];
  const icons: Record<WordState, { outline: string; filled: string }> = {
    NEW: { outline: '◇', filled: '◆' },
    LEARNING: { outline: '△', filled: '▲' },
    REVIEWING: { outline: '○', filled: '●' },
    MASTERED: { outline: '☆', filled: '★' },
  };

  const icon = focused ? icons[state].filled : icons[state].outline;

  return (
    <View style={[tabStyles.iconContainer, focused && { backgroundColor: theme.glow }]}>
      <Text style={[tabStyles.icon, { color: focused ? theme.color : AppColors.textMuted }]}>
        {icon}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
});

/**
 * 4-Tab navigator mapping to the word state machine:
 *   Dictionary (NEW) → Learning → Reviewing → Mastered
 */
export default function TabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const words = useWordStore((s) => s.words);

  const { newCount, learningCount, reviewingCount, masteredCount } = useMemo(() => {
    let newCount = 0;
    let learningCount = 0;
    let reviewingCount = 0;
    let masteredCount = 0;

    for (const w of words) {
      if (w.currentState === 'NEW') newCount++;
      else if (w.currentState === 'LEARNING') learningCount++;
      else if (w.currentState === 'REVIEWING') reviewingCount++;
      else if (w.currentState === 'MASTERED') masteredCount++;
    }

    return { newCount, learningCount, reviewingCount, masteredCount };
  }, [words]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.textMuted,
        tabBarStyle: {
          backgroundColor: isDark ? AppColors.surfaceDark : AppColors.cardLight,
          borderTopColor: isDark ? AppColors.borderDark : AppColors.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: {
          ...Typography.caption2,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarBadgeStyle: {
          ...Typography.caption2,
          fontWeight: '700',
          fontSize: 10,
          minWidth: 18,
          height: 18,
          lineHeight: 15,
          borderRadius: 9,
        },
      }}
    >
      <Tabs.Screen
        name="dictionary"
        options={{
          title: 'Dictionary',
          tabBarIcon: ({ focused }) => <TabIcon state="NEW" focused={focused} />,
          tabBarActiveTintColor: StateTheme.NEW.color,
          tabBarBadge: newCount > 0 ? newCount : undefined,
          tabBarBadgeStyle: { backgroundColor: StateTheme.NEW.color },
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: 'Learning',
          tabBarIcon: ({ focused }) => <TabIcon state="LEARNING" focused={focused} />,
          tabBarActiveTintColor: StateTheme.LEARNING.color,
          tabBarBadge: learningCount > 0 ? learningCount : undefined,
          tabBarBadgeStyle: { backgroundColor: StateTheme.LEARNING.color },
        }}
      />
      <Tabs.Screen
        name="reviewing"
        options={{
          title: 'Reviewing',
          tabBarIcon: ({ focused }) => <TabIcon state="REVIEWING" focused={focused} />,
          tabBarActiveTintColor: StateTheme.REVIEWING.color,
          tabBarBadge: reviewingCount > 0 ? reviewingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: StateTheme.REVIEWING.color },
        }}
      />
      <Tabs.Screen
        name="mastered"
        options={{
          title: 'Mastered',
          tabBarIcon: ({ focused }) => <TabIcon state="MASTERED" focused={focused} />,
          tabBarActiveTintColor: StateTheme.MASTERED.color,
          tabBarBadge: masteredCount > 0 ? masteredCount : undefined,
          tabBarBadgeStyle: { backgroundColor: StateTheme.MASTERED.color },
        }}
      />
    </Tabs>
  );
}
