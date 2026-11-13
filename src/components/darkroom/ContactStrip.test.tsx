// ABOUTME: ContactStrip (spec §8.2): five stills at STILL_P labelled "Stage n · Name", in a focusable region
// ABOUTME: named "Five stills of the method sequence"; the Ship still carries the stamp.
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { METHOD_STAGES } from '../../data/method';
import { ContactStrip } from './ContactStrip';
import { stubObservers } from './testing';

vi.mock('../../lib/darkroom/paint', () => ({ paintStill: vi.fn(() => null) }));

describe('ContactStrip', () => {
  beforeEach(() => stubObservers());
  afterEach(() => vi.unstubAllGlobals());

  it('is a focusable region named for its stills', () => {
    render(<ContactStrip stages={METHOD_STAGES} />);
    const region = screen.getByRole('region', { name: 'Five stills of the method sequence' });
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('shows one labelled still per stage, in order', () => {
    render(<ContactStrip stages={METHOD_STAGES} />);
    const region = screen.getByRole('region', { name: 'Five stills of the method sequence' });
    const imgs = within(region).getAllByRole('img');
    expect(imgs).toHaveLength(5);
    expect(imgs.map((i) => i.getAttribute('aria-label'))).toEqual(
      METHOD_STAGES.map((s, i) => `Still frame for stage ${i + 1}, ${s.name}`),
    );
    expect(Array.from(region.querySelectorAll('figcaption')).map((c) => c.textContent)).toEqual([
      'Stage 1 · Read',
      'Stage 2 · Digest',
      'Stage 3 · Ideate',
      'Stage 4 · Experiment',
      'Stage 5 · Ship',
    ]);
  });

  it('stamps only the last still', () => {
    const { container } = render(<ContactStrip stages={METHOD_STAGES} />);
    const figs = Array.from(container.querySelectorAll('figure'));
    expect(figs.map((f) => !!f.querySelector('.stamp'))).toEqual([false, false, false, false, true]);
  });

  it('derives the count word from the stages', () => {
    render(<ContactStrip stages={METHOD_STAGES.slice(0, 3)} />);
    expect(screen.getByRole('region', { name: 'Three stills of the method sequence' })).toBeInTheDocument();
  });
});
