// ABOUTME: useLiving(): the /api/living data for /building and the homepage, fetched once per
// ABOUTME: page load (one module-level promise shared by every caller). Failures of any kind are 'error'.
import { useEffect, useState } from 'react';
import { isLiving, type Living } from '../lib/living/contract';

export type LivingState =
  | { status: 'loading'; data: null }
  | { status: 'ok'; data: Living }
  | { status: 'error'; data: null };

const LOADING: LivingState = { status: 'loading', data: null };
const ERROR: LivingState = { status: 'error', data: null };

let request: Promise<LivingState> | null = null;
let settled: LivingState | null = null;

async function load(): Promise<LivingState> {
  try {
    const res = await fetch('/api/living', { headers: { Accept: 'application/json' } });
    if (!res.ok) return ERROR;
    const body: unknown = await res.json();
    return isLiving(body) ? { status: 'ok', data: body } : ERROR;
  } catch {
    return ERROR;
  }
}

function living(): Promise<LivingState> {
  if (!request) {
    request = load().then((state) => (settled = state));
  }
  return request;
}

export function useLiving(): LivingState {
  const [state, setState] = useState<LivingState>(() => settled ?? LOADING);
  useEffect(() => {
    if (settled) return;
    let live = true;
    void living().then((s) => {
      if (live) setState(s);
    });
    return () => {
      live = false;
    };
  }, []);
  return state;
}

/** Forget the cached request, so each test starts from a fresh page load. */
export function resetLivingForTests(): void {
  request = null;
  settled = null;
}
