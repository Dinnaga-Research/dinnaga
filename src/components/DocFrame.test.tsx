// ABOUTME: Tests the shared DocFrame viewer chrome — header strip props, the doc
// ABOUTME: viewer shadow root mounting (via DocViewer), optional note.
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DocFrame } from './DocFrame';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const BASE = {
  eyebrow: 'Test doc',
  title: 'Test Document',
  meta: 'published 2026-01-01',
  docPath: '/artifact-docs/test.html',
  screenLabel: 'Test',
};

describe('DocFrame', () => {
  it('renders the header strip: eyebrow, title, meta, and standalone link', () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('Not found'),
    });

    render(
      <BrowserRouter>
        <DocFrame {...BASE} />
      </BrowserRouter>,
    );
    expect(screen.getByText('Test doc')).toBeInTheDocument();
    // Title is now a paragraph, not h1
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('published 2026-01-01')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open standalone/i })).toHaveAttribute(
      'href',
      '/artifact-docs/test.html',
    );
  });

  it('renders the doc viewer with the docPath', () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('Not found'),
    });

    const { container } = render(
      <BrowserRouter>
        <DocFrame {...BASE} />
      </BrowserRouter>,
    );
    const host = container.querySelector('[data-doc-host]');
    expect(host).toBeInTheDocument();
  });

  it('renders the note when present', () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('Not found'),
    });

    render(
      <BrowserRouter>
        <DocFrame {...BASE} note="A caveat about the doc." />
      </BrowserRouter>,
    );
    expect(screen.getByText('A caveat about the doc.')).toBeInTheDocument();
  });

  it('omits the note element when absent', () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('Not found'),
    });

    const { container } = render(
      <BrowserRouter>
        <DocFrame {...BASE} />
      </BrowserRouter>,
    );
    expect(container.querySelector('.artifact-note')).toBeNull();
  });

  it('labels the screen via data-screen-label', () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('Not found'),
    });

    const { container } = render(
      <BrowserRouter>
        <DocFrame {...BASE} />
      </BrowserRouter>,
    );
    expect(container.querySelector('section')).toHaveAttribute('data-screen-label', 'Test');
  });
});
