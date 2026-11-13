// ABOUTME: Tests the DocFrame reader frame: the sticky Doc bar, the doc viewer host, and
// ABOUTME: the About this doc colophon in the two-column grid (title, date, tested line, note); no h1.
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocFrame } from './DocFrame';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const BASE = {
  backHref: '/artifacts',
  backLabel: 'Behind the scenes',
  kind: 'Doc \u00b7 Test',
  colophonTitle: 'Test Document',
  dateLine: 'Published 2026-01-01',
  docPath: '/artifact-docs/test.html',
};

function renderFrame(extra: { note?: string; tested?: string } = {}) {
  return render(
    <BrowserRouter>
      <DocFrame {...BASE} {...extra} />
    </BrowserRouter>,
  );
}

describe('DocFrame', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: vi.fn().mockResolvedValue('Not found') });
  });

  it('renders the Doc bar as a nav with back link, kind and standalone link', () => {
    renderFrame();
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    expect(within(bar).getByRole('link', { name: '\u2190 Behind the scenes' })).toHaveAttribute('href', '/artifacts');
    expect(within(bar).getByText('Doc \u00b7 Test')).toBeInTheDocument();
    expect(within(bar).getByRole('link', { name: 'Open standalone' })).toHaveAttribute(
      'href',
      '/artifact-docs/test.html',
    );
  });

  it('renders the bar in the §7.7 roles: back and standalone links, the kind as a label between them', () => {
    renderFrame();
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    const kind = within(bar).getByText('Doc \u00b7 Test');
    expect(kind).toHaveClass('dn-label');
    const [back, open] = within(bar).getAllByRole('link');
    expect(back!.compareDocumentPosition(kind) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(kind.compareDocumentPosition(open!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the colophon: About this doc h2, title as plain text (not a heading), date line', () => {
    renderFrame();
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    expect(within(colophon).getAllByRole('heading')).toHaveLength(1);
    const title = within(colophon).getByText('Test Document');
    expect(title).toHaveClass('doc-colophon-title');
    expect(within(colophon).getByText('Published 2026-01-01')).toBeInTheDocument();
  });

  it('lays the colophon out in the two-column grid: the h2 in column 1, everything else in column 2', () => {
    renderFrame({ note: 'A note.', tested: 'Checked.' });
    const head = screen.getByRole('heading', { level: 2, name: 'About this doc' });
    expect(head).toHaveClass('dn-grid__label');
    const grid = head.parentElement!;
    expect(grid).toHaveClass('dn-grid');
    const body = grid.querySelector('.dn-grid__body')!;
    for (const text of ['Test Document', 'Published 2026-01-01', 'Checked.', 'A note.']) {
      expect(body).toContainElement(screen.getByText(text));
    }
  });

  it('orders column 2 as title, date line, tested line, note (§7.7)', () => {
    renderFrame({ note: 'A note.', tested: 'Checked.' });
    const order = ['Test Document', 'Published 2026-01-01', 'Checked.', 'A note.'].map((t) => screen.getByText(t));
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('renders the note when present and omits it when absent', () => {
    const { unmount } = renderFrame({ note: 'A caveat about the doc.' });
    expect(screen.getByText('A caveat about the doc.')).toBeInTheDocument();
    unmount();
    const { container } = renderFrame();
    expect(container.querySelector('.doc-colophon-note')).toBeNull();
  });

  it('renders the tested line in the colophon, under the title, when given', () => {
    renderFrame({ tested: 'Checked against the docs on 9 Sep 2026.' });
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    const line = within(colophon).getByText('Checked against the docs on 9 Sep 2026.');
    expect(line).toHaveClass('tested-line');
    expect(line.querySelector('.tested-mark')).toHaveAttribute('aria-hidden', 'true');
    const title = within(colophon).getByText('Test Document');
    expect(title.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders no tested line without one', () => {
    const { container } = renderFrame();
    expect(container.querySelector('.tested-line')).toBeNull();
  });

  it('renders no h1 of its own', () => {
    renderFrame({ note: 'x' });
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('renders the doc host between the bar and the colophon', () => {
    const { container } = renderFrame();
    const host = container.querySelector('[data-doc-host]');
    expect(host).toBeInTheDocument();
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    expect(bar.compareDocumentPosition(host!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(host!.compareDocumentPosition(colophon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('marks the document as a reader route while mounted', () => {
    const { unmount } = renderFrame();
    expect(document.documentElement.dataset.docReader).toBe('');
    unmount();
    expect(document.documentElement.dataset.docReader).toBeUndefined();
  });
});
