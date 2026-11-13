// ABOUTME: Tests /atisha (#63): the h1, lede, bar, state line by published count, the register of
// ABOUTME: published Docs and the board line; with no published Docs, the empty state and no register.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DOCS, publishedDocs } from '../../data/docs';
import { ATISHA_PROJECT_URL } from '../../data/links';
import type { DocEntry } from '../../types';
import { Atisha } from './Atisha';

const LEDE = 'The public library. Every document here was tested before it was published, and says how.';
const BAR =
  "We only publish what we've used ourselves. When a document relies on someone else's tool, it names the tool and links to it.";
const STATE_SOME = 'Cheat sheets and reports today. Whitepapers and living documents are planned.';
const STATE_NONE = 'Nothing is published here yet. Whitepapers and living documents are planned.';
const BOARD = 'Plans for Atisha are tracked on the public Atisha board.';

// A Doc without `publish: true` stays Behind the scenes.
const HIDDEN: DocEntry = {
  slug: 'hidden-fixture',
  title: 'Hidden fixture',
  project: 'Fixture',
  summary: 'A fixture Doc that is not published.',
  published: '2026-10-01',
  docPath: '/artifact-docs/hidden-fixture.html',
  note: '',
};

function renderAtisha(docs?: DocEntry[]) {
  return render(
    <MemoryRouter>
      <Atisha docs={docs} />
    </MemoryRouter>,
  );
}

const exactText = (s: string) => (_: string, el: Element | null) => el?.textContent === s && el.tagName === 'P';

describe('Atisha', () => {
  it('renders the h1, the lede, the bar and the state line verbatim', () => {
    renderAtisha();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Atisha');
    expect(screen.getByText(LEDE).textContent).toBe(LEDE);
    expect(screen.getByText(BAR).textContent).toBe(BAR);
    expect(screen.getByText(STATE_SOME).textContent).toBe(STATE_SOME);
    expect(screen.queryByText(STATE_NONE)).toBeNull();
  });

  it('renders the board line with "Atisha board" linked to the public board', () => {
    renderAtisha();
    expect(screen.getByText(exactText(BOARD))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Atisha board' })).toHaveAttribute('href', ATISHA_PROJECT_URL);
  });

  it('lists the three published Docs as register rows, each with link, summary, kind and tested line', () => {
    renderAtisha();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    publishedDocs().forEach((doc, i) => {
      const row = rows[i]!;
      expect(within(row).getByRole('heading', { level: 2 }).textContent).toBe(doc.title);
      expect(within(row).getByRole('link', { name: doc.title })).toHaveAttribute('href', `/atisha/${doc.slug}`);
      expect(within(row).getByText(doc.summary)).toBeInTheDocument();
      expect(within(row).getByText(doc.kind)).toBeInTheDocument();
      const tested = row.querySelector('.tested-line')!;
      expect(tested.textContent).toBe(doc.tested);
      expect(tested.querySelector('.tested-mark')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('never lists a Doc without publish: true', () => {
    renderAtisha([...DOCS, HIDDEN]);
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText('Hidden fixture')).toBeNull();
  });

  it('with no published Docs shows the empty state line and no register', () => {
    renderAtisha([HIDDEN]);
    expect(screen.getByText(STATE_NONE).textContent).toBe(STATE_NONE);
    expect(screen.queryByText(STATE_SOME)).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    // The rest of the page still stands.
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Atisha');
    expect(screen.getByText(BAR)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Atisha board' })).toBeInTheDocument();
  });

  it('puts the board line after the register, so the register comes first when tabbing through the page', () => {
    renderAtisha();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/atisha/llm-best-practices-github-copilot');
    expect(links[links.length - 1]).toHaveAccessibleName('Atisha board');
  });
});
