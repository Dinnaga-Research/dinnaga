// ABOUTME: useReducedMotion (spec §6): motion only when (prefers-reduced-motion: no-preference) matches;
// ABOUTME: it follows changes without a reload, and with no matchMedia it stays reduced.
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from './useReducedMotion';

function fakeMatchMedia(noPreference: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return noPreference;
    },
    media: '(prefers-reduced-motion: no-preference)',
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  const matchMedia = vi.fn(() => mql);
  vi.stubGlobal('matchMedia', matchMedia);
  return {
    matchMedia,
    set(v: boolean) {
      noPreference = v;
      listeners.forEach((cb) => cb());
    },
    listeners,
  };
}

describe('useReducedMotion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is false when no-preference matches', () => {
    const mm = fakeMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    expect(mm.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: no-preference)');
  });

  it('is true when the user asks for reduced motion', () => {
    fakeMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('switches mode on change, without a reload, and unsubscribes on unmount', () => {
    const mm = fakeMatchMedia(true);
    const { result, unmount } = renderHook(() => useReducedMotion());
    act(() => mm.set(false));
    expect(result.current).toBe(true);
    act(() => mm.set(true));
    expect(result.current).toBe(false);
    unmount();
    expect(mm.listeners.size).toBe(0);
  });

  it('is true when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
