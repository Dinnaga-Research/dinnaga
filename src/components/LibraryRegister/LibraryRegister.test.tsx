// ABOUTME: Tests the library register (spec §7.3, #63): one row per published Doc with its date, title
// ABOUTME: link, summary, tested line and kind; the heading level is the caller's; nothing at zero Docs.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { publishedDocs } from '../../data/docs';
import type { PublishedDoc } from '../../types';
import { LibraryRegister } from './LibraryRegister';

function renderRegister(docs: PublishedDoc[] = publishedDocs(), headingLevel: 2 | 3 = 2) {
  return render(
    <MemoryRouter>
      <LibraryRegister docs={docs} headingLevel={headingLevel} />
    </MemoryRouter>,
  );
}

describe('LibraryRegister', () => {
  it('renders one list item per published Doc, in the order given', () => {
    renderRegister();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => within(r).getByRole('heading').textContent)).toEqual([
      'Applying LLM best practices in GitHub Copilot',
      'Applying LLM best practices in Microsoft Copilot Studio',
      'SLAMWICH tasting report',
    ]);
  });

  it('gives every row a title link to /atisha/<slug>, the summary, the kind and the tested line', () => {
    renderRegister();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    publishedDocs().forEach((doc, i) => {
      const row = rows[i]!;
      expect(within(row).getByRole('link', { name: doc.title })).toHaveAttribute('href', `/atisha/${doc.slug}`);
      expect(within(row).getByText(doc.summary)).toBeInTheDocument();
      expect(within(row).getByText(doc.kind)).toHaveClass('dn-label');
      const tested = row.querySelector('.tested-line');
      expect(tested).not.toBeNull();
      expect(tested!.textContent).toBe(doc.tested);
      const mark = tested!.querySelector('.tested-mark');
      expect(mark).not.toBeNull();
      expect(mark).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('shows each date as a label in the single-date format, with a machine-readable time', () => {
    renderRegister();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    const times = rows.map((r) => r.querySelector('time'));
    expect(times.map((t) => t?.textContent)).toEqual(['9 Sep 2026', '9 Sep 2026', '8 Aug 2026']);
    expect(times.map((t) => t?.getAttribute('datetime'))).toEqual(['2026-09-09', '2026-09-09', '2026-08-08']);
    expect(times[0]!.closest('.dn-label')).not.toBeNull();
  });

  it('makes only the title a link, never the whole row', () => {
    renderRegister();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    for (const row of rows) expect(within(row).getAllByRole('link')).toHaveLength(1);
  });

  it('uses the heading level it is given for the row titles', () => {
    const { unmount } = renderRegister(publishedDocs(), 2);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    unmount();
    renderRegister(publishedDocs(), 3);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });

  it('renders nothing for an empty list', () => {
    const { container } = renderRegister([]);
    expect(container).toBeEmptyDOMElement();
  });
});
