/**
 * Extended Design System
 *
 * Premium color palette, typography scale, shadows, and state-specific theming.
 * Preserves the existing Colors/Fonts/Spacing API and adds new tokens.
 */

import '@/global.css';
import { Platform } from 'react-native';
import type { WordState } from '@/types';

// ============================================
// Core Theme (preserved from original)
// ============================================

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#64748B',
  },
  dark: {
    text: '#F1F5F9',
    background: '#0B0F1A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    textSecondary: '#94A3B8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// ============================================
// Extended Brand Palette
// ============================================

export const AppColors = {
  // Brand gradient
  primary: '#6366F1', // Indigo-500
  primaryDark: '#4338CA', // Indigo-700
  primaryLight: '#A5B4FC', // Indigo-300
  primaryGlow: 'rgba(99, 102, 241, 0.15)',

  // Accent
  accent: '#8B5CF6', // Violet-500
  accentLight: '#C4B5FD', // Violet-300

  // State colors — each tab has a unique identity
  stateNew: '#6366F1', // Indigo — fresh, untouched
  stateLearning: '#F59E0B', // Amber — active study
  stateReviewing: '#8B5CF6', // Violet — refining
  stateMastered: '#10B981', // Emerald — accomplished

  // Action colors
  success: '#059669', // Emerald-600
  successLight: '#D1FAE5', // Emerald-100
  successGlow: 'rgba(5, 150, 105, 0.15)',

  danger: '#E11D48', // Rose-600
  dangerLight: '#FFE4E6', // Rose-100
  dangerGlow: 'rgba(225, 29, 72, 0.15)',

  warning: '#D97706', // Amber-600
  warningLight: '#FEF3C7', // Amber-100

  // Surfaces
  cardLight: '#FFFFFF',
  cardDark: '#1E293B',
  surfaceLight: '#F8FAFC',
  surfaceDark: '#0F172A',

  // Borders
  borderLight: '#E2E8F0',
  borderDark: '#334155',

  // Muted text
  textMuted: '#94A3B8',
  textMutedDark: '#64748B',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// ============================================
// State Theme Mapping
// ============================================

export const StateTheme: Record<
  WordState,
  { color: string; lightBg: string; glow: string; label: string; icon: string; iconFilled: string }
> = {
  NEW: {
    color: AppColors.stateNew,
    lightBg: '#EEF2FF', // Indigo-50
    glow: 'rgba(99, 102, 241, 0.12)',
    label: 'Dictionary',
    icon: 'book-outline',
    iconFilled: 'book',
  },
  LEARNING: {
    color: AppColors.stateLearning,
    lightBg: '#FFFBEB', // Amber-50
    glow: 'rgba(245, 158, 11, 0.12)',
    label: 'Learning',
    icon: 'school-outline',
    iconFilled: 'school',
  },
  REVIEWING: {
    color: AppColors.stateReviewing,
    lightBg: '#F5F3FF', // Violet-50
    glow: 'rgba(139, 92, 246, 0.12)',
    label: 'Reviewing',
    icon: 'refresh-outline',
    iconFilled: 'refresh',
  },
  MASTERED: {
    color: AppColors.stateMastered,
    lightBg: '#ECFDF5', // Emerald-50
    glow: 'rgba(16, 185, 129, 0.12)',
    label: 'Mastered',
    icon: 'star-outline',
    iconFilled: 'star',
  },
};

// ============================================
// Shadow Presets
// ============================================

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 32,
    },
    android: { elevation: 12 },
    default: {},
  }),
  colored: (color: string) =>
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
} as const;

// ============================================
// Typography
// ============================================

export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
} as const;

// ============================================
// Border Radius
// ============================================

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;
