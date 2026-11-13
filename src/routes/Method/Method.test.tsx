// ABOUTME: Tests How we test (/method, #71): the h1, lede and intro verbatim, the five stages numbered from
// ABOUTME: array order with their details, a labelled still per stage (stamp on Ship), and the closing Atisha line.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setWidth, stubObservers } from '../../components/darkroom/testing';
import { LEDE } from '../../data/copy';
import { METHOD_STAGES, type MethodStage } from '../../data/method';
import { STILL_P } from '../../lib/darkroom/marks';
import { Method } from './Method';

const paint = vi.hoisted(() => ({
  paintStill: vi.fn(() => ({ scene: { stamp: { cx: 300, cy: 400, d: 100 } }, scale: 1 })),
}));
vi.mock('../../lib/darkroom/paint', () => paint);

const flush = () => new Promise((r) => setTimeout(r, 0));

const DETAILS = [
  ['Read', 'Find interesting papers, posts and releases. Queue them.'],
  ['Digest', 'Read them. Write up what actually matters.'],
  ['Ideate', 'Promising ideas get a note worth coming back to.'],
  ['Experiment', 'Build it, try it, see what happens. Most die here.'],
  ['Ship', 'What survives becomes a skill, a tool or a workflow, and a candidate for Atisha.'],
] as const;

function renderMethod(stages?: MethodStage[]) {
  return render(
    <MemoryRouter>
      <Method stages={stages} />
    </MemoryRouter>,
  );
}

describe('Method', () => {
  let obs: ReturnType<typeof stubObservers>;
  beforeEach(() => {
    obs = stubObservers();
    paint.paintStill.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders the h1, the lede and the intro verbatim', () => {
    renderMethod();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^How we test$/);
    expect(screen.getByText(LEDE)).toBeInTheDocument();
    expect(LEDE).toBe(
      'Dinnaga Research reads the papers, podcasts and vendor docs, tests what they claim, and publishes what holds up.',
    );
    expect(
      screen.getByText('Every idea goes through the same five stages. Most never reach the last one.'),
    ).toBeInTheDocument();
  });

  it('derives the intro’s count from the stages', () => {
    renderMethod(METHOD_STAGES.slice(0, 3));
    expect(
      screen.getByText('Every idea goes through the same three stages. Most never reach the last one.'),
    ).toBeInTheDocument();
  });

  it('renders the five stages in order, numbered 1 to 5 from array order, details verbatim', () => {
    renderMethod();
    const list = screen.getByRole('list', { name: 'The five stages' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    items.forEach((item, i) => {
      const [name, detail] = DETAILS[i]!;
      const heading = within(item).getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(new RegExp(`^${i + 1}\\s*${name}$`));
      expect(item.querySelector('.method-stage__n')).toHaveTextContent(String(i + 1));
      expect(item.querySelector('.method-stage__detail')?.textContent).toBe(detail);
    });
  });

  it('has no hand-typed stage numbers in the data', () => {
    for (const s of METHOD_STAGES) expect(Object.keys(s).sort()).toEqual(['detail', 'name']);
  });

  it('gives each stage a labelled still, and only Ship the stamp', () => {
    const { container } = renderMethod();
    DETAILS.forEach(([name], i) => {
      const img = screen.getByRole('img', { name: `Still frame for stage ${i + 1}, ${name}` });
      expect(img.tagName).toBe('CANVAS');
    });
    const items = container.querySelectorAll('.method-stage');
    items.forEach((item, i) => {
      expect(item.querySelector('svg.stamp') !== null).toBe(i === items.length - 1);
    });
  });

  it('paints each still at its moment of the run, only once it is near', async () => {
    const { container } = renderMethod();
    const boxes = [...container.querySelectorAll('.still__box')];
    expect(boxes).toHaveLength(5);
    boxes.forEach((b) => setWidth(b, 600));
    await flush();
    expect(paint.paintStill).not.toHaveBeenCalled();
    // One at a time: concurrent dynamic imports of a vi.mock'ed module race the mock in vitest.
    for (const [i, b] of boxes.entries()) {
      obs.intersect(b);
      await vi.waitFor(() => expect(paint.paintStill).toHaveBeenCalledTimes(i + 1));
    }
    const calls = paint.paintStill.mock.calls as unknown as [unknown, number, number, number, number][];
    expect(calls.map((c) => [c[3], c[4]])).toEqual(STILL_P.map((p, i) => [p, i]));
  });

  it('closes with the Atisha line, Atisha linked', () => {
    renderMethod();
    const link = screen.getByRole('link', { name: 'Atisha' });
    expect(link).toHaveAttribute('href', '/atisha');
    expect(link.closest('p')?.textContent).toBe(
      'Published documents are in Atisha, and each one says how it was tested.',
    );
  });

  it('drops the funnel paragraph and shows no project-planning link while that repo is private', () => {
    const { container } = renderMethod();
    expect(container.textContent).not.toMatch(/Project Planning is the funnel/i);
    expect(screen.queryByRole('link', { name: /project-planning/i })).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('shows the project-planning link once that repo has a URL', async () => {
    vi.resetModules();
    vi.doMock('../../data/links', async (orig) => ({
      ...(await orig<typeof import('../../data/links')>()),
      PROJECT_PLANNING_URL: 'https://github.com/Dinnaga-Research/project-planning',
    }));
    const { Method: WithLink } = await import('./Method');
    render(
      <MemoryRouter>
        <WithLink />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /project-planning/i })).toHaveAttribute(
      'href',
      'https://github.com/Dinnaga-Research/project-planning',
    );
    vi.doUnmock('../../data/links');
  });
});
