// ABOUTME: Tests the homepage hero (#67, #69's founder link): the copy verbatim inside the run, the one library link,
// ABOUTME: no button outside the rail, the skip link to #after-sequence, and the cut kit components gone for good.
import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubMotion, stubObservers } from '../../../components/darkroom/testing';
import { HomeHero } from './HomeHero';

const rt = vi.hoisted(() => {
  const handle = { destroy: vi.fn(), jumpTo: vi.fn(), setProgress: vi.fn(), stats: vi.fn() };
  return { handle, mountSequence: vi.fn(() => handle) };
});
vi.mock('../../../lib/darkroom', () => ({ mountSequence: rt.mountSequence }));
vi.mock('../../../lib/darkroom/paint', () => ({ paintStill: vi.fn(() => null) }));

const H1 = 'Living documents for engineers who code with AI';
const LEDE =
  'Dinnaga Research reads the papers, podcasts and vendor docs, tests what they claim, and publishes what holds up.';
const FOUNDER = 'Dinnaga Research is run by David Ryan.';
const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

function renderHero() {
  return render(
    <MemoryRouter>
      <HomeHero />
    </MemoryRouter>,
  );
}

function expectHeroCopy() {
  const h1 = screen.getByRole('heading', { level: 1 });
  expect(h1).toHaveTextContent(new RegExp(`^${H1}$`));
  // The engine freezes the h1's line breaks, so it must hold one plain text node.
  expect(h1.childElementCount).toBe(0);
  expect(screen.getByText(LEDE)).toBeInTheDocument();
  const name = screen.getByRole('link', { name: 'David Ryan' });
  expect(name).toHaveAttribute('href', '/building');
  expect(name.parentElement!.textContent).toBe(FOUNDER);
  expect(screen.getByRole('link', { name: 'Browse the library →' })).toHaveAttribute('href', '/atisha');
}

describe('HomeHero', () => {
  beforeEach(() => {
    stubObservers();
    rt.mountSequence.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  describe('with motion', () => {
    beforeEach(() => stubMotion(true));

    it('renders the h1, lede, founder line and library link verbatim, in that order, inside the run', async () => {
      const { container } = renderHero();
      await flush();
      expectHeroCopy();
      const hero = container.querySelector('.run__hero')!;
      const order = [
        screen.getByRole('heading', { level: 1 }),
        screen.getByText(LEDE),
        screen.getByRole('link', { name: 'David Ryan' }),
        screen.getByRole('link', { name: 'Browse the library →' }),
      ];
      for (const el of order) expect(hero.contains(el)).toBe(true);
      for (let i = 1; i < order.length; i++) {
        expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
      expect(rt.mountSequence).toHaveBeenCalledTimes(1);
    });

    it('is the one h1, with the cue under the copy and the four sources over the art', () => {
      const { container } = renderHero();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByText('Scroll to develop')).toHaveAttribute('aria-hidden', 'true');
      expect(Array.from(container.querySelectorAll('.run__source')).map((s) => s.textContent)).toEqual([
        'Papers',
        'Podcasts',
        'Vendor docs',
        'Releases',
      ]);
    });

    it('has no button outside the rail, and the library link comes before the rail', () => {
      const { container } = renderHero();
      const rail = screen.getByRole('navigation', { name: 'Jump to a method stage' });
      const buttons = Array.from(container.querySelectorAll('button'));
      expect(buttons).toHaveLength(5);
      for (const b of buttons) expect(rail.contains(b)).toBe(true);
      const link = screen.getByRole('link', { name: 'Browse the library →' });
      expect(link.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('skips the sequence to #after-sequence, which follows the run', () => {
      const { container } = renderHero();
      const skip = screen.getByRole('link', { name: 'Skip the sequence' });
      expect(skip).toHaveAttribute('href', '#after-sequence');
      const after = container.querySelector('#after-sequence')!;
      expect(container.querySelector('.run')!.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(within(rail()).getAllByRole('button').map((b) => b.textContent)).toEqual([
        '01Read',
        '02Digest',
        '03Ideate',
        '04Experiment',
        '05Ship',
      ]);
    });
  });

  describe('reduced motion', () => {
    beforeEach(() => stubMotion(false));

    it('renders the same copy, a contact strip of five stills, no rail and no button', () => {
      const { container } = renderHero();
      expectHeroCopy();
      const strip = screen.getByRole('region', { name: 'Five stills of the method sequence' });
      expect(within(strip).getAllByRole('img')).toHaveLength(5);
      expect(container.querySelectorAll('button')).toHaveLength(0);
      expect(container.querySelector('#after-sequence')).not.toBeNull();
      expect(rt.mountSequence).not.toHaveBeenCalled();
    });
  });

  it('the cut kit components and their data are gone (#67)', () => {
    const components = Object.keys(import.meta.glob('../../../components/**/*.tsx'));
    const data = Object.keys(import.meta.glob('../../../data/*.ts'));
    const names = [...components, ...data].map((p) => p.split('/').pop()!.replace(/\.tsx?$/, ''));
    for (const cut of [
      'Terminal',
      'Hero',
      'Ticker',
      'Practices',
      'DataPanel',
      'AsciiArt',
      'CautionDivider',
      'tickerItems',
      'practices',
      'surfaceData',
      'bootLines',
      'unlockLines',
    ]) {
      expect(names, cut).not.toContain(cut);
    }
  });
});

const rail = () => screen.getByRole('navigation', { name: 'Jump to a method stage' });
