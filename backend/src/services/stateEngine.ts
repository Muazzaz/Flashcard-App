import type { WordState, ProgressAction } from '../types';

/**
 * Pure function implementing the 4-state machine.
 *
 * Transition table:
 * ┌──────────────┬─────────────┬─────────────┐
 * │ Current      │ Remembered  │ Forgot      │
 * ├──────────────┼─────────────┼─────────────┤
 * │ NEW          │ → MASTERED  │ → LEARNING  │
 * │ LEARNING     │ → REVIEWING │ → LEARNING  │
 * │ REVIEWING    │ → MASTERED  │ → LEARNING  │
 * │ MASTERED     │ → MASTERED  │ → LEARNING  │
 * └──────────────┴─────────────┴─────────────┘
 * Reset from ANY state → NEW
 */
export function computeNextState(
  currentState: WordState,
  action: ProgressAction
): WordState {
  // Escape hatch: always resets to NEW
  if (action === 'reset') return 'NEW';

  // The Penalty: forgot on ANY state demotes to LEARNING
  if (action === 'forgot') return 'LEARNING';

  // action === 'remembered'
  switch (currentState) {
    case 'NEW':
      // Fast-Track: if you already know it, skip straight to MASTERED
      return 'MASTERED';
    case 'LEARNING':
      // Standard path step 1
      return 'REVIEWING';
    case 'REVIEWING':
      // Standard path step 2
      return 'MASTERED';
    case 'MASTERED':
      // Already mastered, no change
      return 'MASTERED';
    default:
      return currentState;
  }
}

/**
 * Validates that a given string is a valid ProgressAction.
 */
export function isValidAction(action: string): action is ProgressAction {
  return action === 'remembered' || action === 'forgot' || action === 'reset';
}

/**
 * Validates that a given string is a valid WordState.
 */
export function isValidState(state: string): state is WordState {
  return (
    state === 'NEW' ||
    state === 'LEARNING' ||
    state === 'REVIEWING' ||
    state === 'MASTERED'
  );
}
