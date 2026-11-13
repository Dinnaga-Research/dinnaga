// ABOUTME: A lazy darkroom chunk that fails to load (a stale chunk after a deploy, a dropped request, a page left
// ABOUTME: mid-import) leaves the page as it is: the run keeps its text and the still stays blank, with no unhandled rejection.
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { METHOD_STAGES } from '../../data/method';
import { FrameStill } from './FrameStill';
import { ProcessSequence } from './ProcessSequence';
import { setWidth, stubMotion, stubObservers } from './testing';

vi.mock('../../lib/darkroom', () => {
  throw new Error('Importing a module script failed.');
});
vi.mock('../../lib/darkroom/paint', () => {
  throw new Error('Importing a module script failed.');
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 20)));

describe('a lazy darkroom chunk that fails to load', () => {
  const rejections: unknown[] = [];
  const onRejection = (reason: unknown) => rejections.push(reason);
  let obs: ReturnType<typeof stubObservers>;
  beforeEach(() => {
    rejections.length = 0;
    process.on('unhandledRejection', onRejection);
    obs = stubObservers();
  });
  afterEach(() => {
    process.off('unhandledRejection', onRejection);
    vi.unstubAllGlobals();
  });

  it('ProcessSequence keeps its hero and captions and raises nothing', async () => {
    stubMotion(true);
    render(
      <ProcessSequence stages={METHOD_STAGES} sources={['Papers']} hero={<h1>Dev harness</h1>} afterId="after" />,
    );
    await flush();
    expect(screen.getByRole('heading', { level: 1, name: 'Dev harness' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'The five stages' })).toBeInTheDocument();
    expect(rejections).toEqual([]);
  });

  it('FrameStill stays a labelled, blank image and raises nothing', async () => {
    const { container } = render(<FrameStill p={0.2} index={0} label="Still frame for stage 1, Read" aspect="auto" />);
    const box = container.querySelector('.still__box')!;
    setWidth(box, 600);
    obs.intersect(box);
    await flush();
    expect(screen.getByRole('img', { name: 'Still frame for stage 1, Read' })).toBeInTheDocument();
    expect(rejections).toEqual([]);
  });
});
