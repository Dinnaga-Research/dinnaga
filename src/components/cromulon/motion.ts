// ABOUTME: The Cromulon motion gate, as a pure function: may the plasma flow right now?
// ABOUTME: It flows for 5 s after activity (WCAG 2.2.2), always after unlock, never when reduced, hidden or off-screen.

export const SETTLE_MS = 5000;

export interface MotionState {
  now: number;
  lastActive: number;
  visible: boolean;
  hidden: boolean;
  reduced: boolean;
  unlocked: boolean;
}

export function shouldAnimate({ now, lastActive, visible, hidden, reduced, unlocked }: MotionState): boolean {
  if (reduced || hidden || !visible) return false;
  return unlocked || now - lastActive <= SETTLE_MS;
}
