// ABOUTME: ProcessSequence (spec §8.2): reduced motion renders the hero and a contact strip without loading the
// ABOUTME: runtime; with motion it renders the rail, the captions, the skip link and the figure, and mounts the runtime.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { METHOD_STAGES } from '../../data/method';
import { ProcessSequence } from './ProcessSequence';
import { stubMotion, stubObservers } from './testing';

const rt = vi.hoisted(() => {
  const handle = { destroy: vi.fn(), jumpTo: vi.fn(), setProgress: vi.fn(), stats: vi.fn() };
  return { loaded: vi.fn(), handle, mountSequence: vi.fn<(o: { onStage?: (k: number) => void }) => typeof handle>(() => handle) };
});
vi.mock('../../lib/darkroom', () => {
  rt.loaded();
  return { mountSequence: rt.mountSequence };
});
vi.mock('../../lib/darkroom/paint', () => ({ paintStill: vi.fn(() => null) }));

const SOURCES = ['Papers', 'Podcasts', 'Vendor docs', 'Releases'];
const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

function renderRun() {
  return render(
    <>
      <ProcessSequence stages={METHOD_STAGES} sources={SOURCES} hero={<h1>Dev harness</h1>} afterId="after-sequence" />
      <div id="after-sequence" />
    </>,
  );
}

describe('ProcessSequence', () => {
  beforeEach(() => {
    stubObservers();
    rt.loaded.mockClear();
    rt.mountSequence.mockClear();
    rt.handle.destroy.mockClear();
    rt.handle.jumpTo.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  describe('reduced motion', () => {
    beforeEach(() => stubMotion(false));

    it('renders the hero slot and a contact strip of five labelled stills', () => {
      renderRun();
      expect(screen.getByRole('heading', { level: 1, name: 'Dev harness' })).toBeInTheDocument();
      const strip = screen.getByRole('region', { name: 'Five stills of the method sequence' });
      expect(within(strip).getAllByRole('img')).toHaveLength(5);
      expect(strip.textContent).toContain('Stage 5 · Ship');
    });

    it('does not import the runtime, and has no plate, rail or captions', async () => {
      const { container } = renderRun();
      await flush();
      expect(rt.loaded).not.toHaveBeenCalled();
      expect(rt.mountSequence).not.toHaveBeenCalled();
      expect(container.querySelector('canvas.plate')).toBeNull();
      expect(screen.queryByRole('navigation', { name: 'Jump to a method stage' })).toBeNull();
      expect(screen.queryByRole('list', { name: 'The five stages' })).toBeNull();
    });
  });

  describe('with motion', () => {
    beforeEach(() => stubMotion(true));

    it('renders the rail: five buttons in a nav named "Jump to a method stage"', () => {
      renderRun();
      const nav = screen.getByRole('navigation', { name: 'Jump to a method stage' });
      expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual([
        '01Read',
        '02Digest',
        '03Ideate',
        '04Experiment',
        '05Ship',
      ]);
    });

    it('renders the captions list from props: "Stage n of 5", the name and the detail', () => {
      renderRun();
      const list = screen.getByRole('list', { name: 'The five stages' });
      const items = within(list).getAllByRole('listitem');
      expect(items).toHaveLength(5);
      items.forEach((li, i) => {
        expect(li.textContent).toContain(`Stage ${i + 1} of 5`);
        expect(li.textContent).toContain(METHOD_STAGES[i]!.name);
        expect(li.textContent).toContain(METHOD_STAGES[i]!.detail);
      });
    });

    it('has no h2 or h3 inside the run', () => {
      const { container } = renderRun();
      expect(container.querySelectorAll('h2, h3, h4')).toHaveLength(0);
    });

    it('has a skip link to #afterId that moves focus past the run', () => {
      renderRun();
      const skip = screen.getByRole('link', { name: 'Skip the sequence' });
      expect(skip).toHaveAttribute('href', '#after-sequence');
      fireEvent.click(skip);
      const target = document.getElementById('after-sequence')!;
      expect(document.activeElement).toBe(target);
      expect(target).toHaveAttribute('tabindex', '-1');
    });

    it('describes the figure in text and hides the art, the source labels, the cue and the counter', () => {
      const { container } = renderRun();
      expect(screen.getByText(/^Figure: a frame sequence\. Columns of grey type from papers, podcasts, vendor docs and releases are read, digested, gathered into notes and tested\. Most notes are struck out\. What survives is set into one page and stamped tested\.$/)).toBeInTheDocument();
      expect(container.querySelector('canvas.plate')).toHaveAttribute('aria-hidden', 'true');
      const overlay = container.querySelector('.run__overlay')!;
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
      expect(Array.from(overlay.querySelectorAll('.run__source')).map((s) => s.textContent)).toEqual(SOURCES);
      expect(screen.getByText('Scroll to develop')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByText('Frame 001 / 180')).toHaveAttribute('aria-hidden', 'true');
    });

    it('loads and mounts the runtime with its elements, and destroys it on unmount', async () => {
      const { unmount } = renderRun();
      await flush();
      expect(rt.mountSequence).toHaveBeenCalledTimes(1);
      const opts = rt.mountSequence.mock.calls[0]![0] as unknown as Record<string, unknown>;
      for (const key of ['run', 'stage', 'plate', 'art', 'hero', 'counter', 'stamp']) expect(opts[key], key).toBeInstanceOf(Element);
      expect(opts.labels).toHaveLength(4);
      unmount();
      expect(rt.handle.destroy).toHaveBeenCalledTimes(1);
    });

    it('re-renders the current stage from the runtime: aria-current on the rail and the caption shown', async () => {
      renderRun();
      await flush();
      const { onStage } = rt.mountSequence.mock.calls[0]![0];
      act(() => onStage!(2));
      expect(screen.getByRole('button', { name: 'Ideate' })).toHaveAttribute('aria-current', 'step');
      const items = within(screen.getByRole('list', { name: 'The five stages' })).getAllByRole('listitem');
      expect(items.map((li) => li.classList.contains('is-on'))).toEqual([false, false, true, false, false]);
    });

    it('a rail button jumps the runtime to its stage', async () => {
      renderRun();
      await flush();
      fireEvent.click(screen.getByRole('button', { name: 'Ship' }));
      expect(rt.handle.jumpTo).toHaveBeenCalledWith(4);
    });
  });

  it('switches mode when the preference changes, without a reload', async () => {
    const motion = stubMotion(true);
    renderRun();
    await flush();
    expect(screen.getByRole('navigation', { name: 'Jump to a method stage' })).toBeInTheDocument();
    act(() => motion.set(false));
    expect(rt.handle.destroy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('navigation', { name: 'Jump to a method stage' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Five stills of the method sequence' })).toBeInTheDocument();
  });
});
