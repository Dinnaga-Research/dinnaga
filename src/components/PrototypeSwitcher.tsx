// ABOUTME: PROTOTYPE (throwaway) — floating bottom bar that cycles ?variant= with ←/→ and exposes
// ABOUTME: extra prototype knobs as URL params. Renders nothing in production builds.
import { useCallback, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

interface PrototypeSwitcherProps {
  variants: { key: string; label: string }[];
  children?: ReactNode;
}

export function PrototypeSwitcher({ variants, children }: PrototypeSwitcherProps) {
  const at = (i: number) => variants[i]!;
  const [params, setParams] = useSearchParams();
  const current = params.get('variant') ?? at(0).key;
  const idx = Math.max(0, variants.findIndex((v) => v.key === current));
  const go = useCallback(
    (delta: number) => {
      const next = at((idx + delta + variants.length) % variants.length).key;
      setParams((p) => {
        p.set('variant', next);
        return p;
      }, { replace: true });
    },
    [idx, variants, setParams],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);
  if (import.meta.env.PROD) return null;
  return (
    <div className="proto-switcher" role="region" aria-label="Prototype controls">
      <div className="proto-switcher-row">
        <button type="button" onClick={() => go(-1)} aria-label="Previous variant">
          ←
        </button>
        <span className="proto-switcher-label">
          {at(idx).key} ({at(idx).label})
        </span>
        <button type="button" onClick={() => go(1)} aria-label="Next variant">
          →
        </button>
      </div>
      {children}
    </div>
  );
}
