// ABOUTME: Dev-only warning logger — no-op unless import.meta.env.DEV.
// ABOUTME: Used by adapter for non-standard patterns that need attention.

/**
 * Log a warning only in development mode.
 * In production, this is a no-op.
 */
export function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}
