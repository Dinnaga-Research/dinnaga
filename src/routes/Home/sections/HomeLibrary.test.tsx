// ABOUTME: Tests the homepage library (#68) with fixture catalogues: the latest 6 published Docs newest first, the
// ABOUTME: Atisha link only past six, the section absent at zero, and the launch set from the real catalogue.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { DocEntry } from '../../../types';
import { HomeLibrary } from './HomeLibrary';

// Published fixture Docs, one per day from 1 Oct 2026, listed oldest first so the order must come from the helper.
function catalogue(n: number): DocEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `fixture-${i + 1}`,
    title: `Fixture ${i + 1}`,
    project: 'Fixture',
    summary: `Fixture summary ${i + 1}.`,
    published: `2026-10-${String(i + 1).padStart(2, '0')}`,
    docPath: `/artifact-docs/fixture-${i + 1}.html`,
    note: '',
    publish: true as const,
    kind: 'Report' as const,
    tested: `Fixture ${i + 1} checked on 1 Oct 2026.`,
  }));
}

function renderLibrary(docs?: DocEntry[]) {
  return render(
    <MemoryRouter>
      <HomeLibrary docs={docs} />
    </MemoryRouter>,
  );
}

const rowTitles = () =>
  within(screen.getByRole('list')).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('HomeLibrary', () => {
  it('renders the h2 and its line verbatim', () => {
    renderLibrary(catalogue(3));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^The library$/);
    expect(screen.getByText('Each document says how it was tested.')).toBeInTheDocument();
  });

  it('7 published Docs: 6 rows newest first, then "Everything in Atisha →" to /atisha', () => {
    const docs = catalogue(7);
    // An unpublished Doc newer than all of them never shows.
    docs.push({ ...docs[0]!, slug: 'hidden', title: 'Hidden', published: '2026-10-30', publish: undefined });
    renderLibrary(docs);
    expect(rowTitles()).toEqual(['Fixture 7', 'Fixture 6', 'Fixture 5', 'Fixture 4', 'Fixture 3', 'Fixture 2']);
    expect(screen.getByRole('link', { name: 'Everything in Atisha →' })).toHaveAttribute('href', '/atisha');
  });

  it('6 published Docs: 6 rows and no Atisha link', () => {
    renderLibrary(catalogue(6));
    expect(rowTitles()).toHaveLength(6);
    expect(screen.queryByRole('link', { name: 'Everything in Atisha →' })).toBeNull();
  });

  it('3 published Docs: 3 rows and no link', () => {
    renderLibrary(catalogue(3));
    expect(rowTitles()).toEqual(['Fixture 3', 'Fixture 2', 'Fixture 1']);
    expect(screen.queryByRole('link', { name: 'Everything in Atisha →' })).toBeNull();
  });

  it('0 published Docs: no heading, nothing rendered', () => {
    const { container } = renderLibrary(catalogue(2).map((d) => ({ ...d, publish: undefined })));
    expect(screen.queryByRole('heading', { name: 'The library' })).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('the real catalogue: the launch Docs in order, each with its tested line and a link into Atisha', () => {
    renderLibrary();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows.map((r) => within(r).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Applying LLM best practices in GitHub Copilot',
      'Applying LLM best practices in Microsoft Copilot Studio',
      'SLAMWICH tasting report',
    ]);
    expect(within(rows[2]!).getByRole('link', { name: 'SLAMWICH tasting report' })).toHaveAttribute(
      'href',
      '/atisha/slamwich-tasting-report',
    );
    for (const row of rows) {
      const line = row.querySelector('.tested-line')!;
      expect(line.querySelector('.tested-mark')).toHaveAttribute('aria-hidden', 'true');
      expect(line.textContent!.length).toBeGreaterThan(20);
    }
  });
});
