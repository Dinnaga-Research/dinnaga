// ABOUTME: useReducedMotion (spec §6): true unless (prefers-reduced-motion: no-preference) matches. It follows
// ABOUTME: the preference live, so the page switches between the run and the stills without a reload.
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: no-preference)';

function query(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
}

function subscribe(onChange: () => void): () => void {
  const mql = query();
  if (!mql) return () => {};
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

const getSnapshot = () => !(query()?.matches ?? false);
const getServerSnapshot = () => true;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
