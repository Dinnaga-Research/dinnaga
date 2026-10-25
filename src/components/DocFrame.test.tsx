// ABOUTME: Tests the DocFrame reader frame: the sticky Doc bar, the doc viewer host, and
// ABOUTME: the About this doc colophon (title, date line, optional note); no h1 of its own.
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

function renderFrame(extra: { note?: string } = {}) {
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

  it('renders the colophon: About this doc h2, title as plain text, date line', () => {
    renderFrame();
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    expect(within(colophon).getByRole('heading', { level: 2, name: 'About this doc' })).toBeInTheDocument();
    const title = within(colophon).getByText('Test Document');
    expect(title.tagName).toBe('STRONG');
    expect(within(colophon).getByText('Published 2026-01-01')).toBeInTheDocument();
  });

  it('renders the note when present and omits it when absent', () => {
    const { unmount } = renderFrame({ note: 'A caveat about the doc.' });
    expect(screen.getByText('A caveat about the doc.')).toBeInTheDocument();
    unmount();
    const { container } = renderFrame();
    expect(container.querySelector('.doc-colophon-note')).toBeNull();
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
