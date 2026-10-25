// ABOUTME: Tests the shared DocFrame viewer chrome — header strip props, the doc
// ABOUTME: iframe's src/title attributes (jsdom never loads iframes), optional note.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocFrame } from './DocFrame';

const BASE = {
  eyebrow: 'Test doc',
  title: 'Test Document',
  meta: 'published 2026-01-01',
  docPath: '/artifact-docs/test.html',
  screenLabel: 'Test',
};

describe('DocFrame', () => {
  it('renders the header strip: eyebrow, title, meta, and standalone link', () => {
    render(<DocFrame {...BASE} />);
    expect(screen.getByText('Test doc')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test Document', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('published 2026-01-01')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open standalone/i })).toHaveAttribute(
      'href',
      '/artifact-docs/test.html',
    );
  });

  it('renders the doc iframe with the title and docPath src', () => {
    render(<DocFrame {...BASE} />);
    const frame = screen.getByTitle('Test Document');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('src', '/artifact-docs/test.html');
  });

  it('renders the note when present', () => {
    render(<DocFrame {...BASE} note="A caveat about the doc." />);
    expect(screen.getByText('A caveat about the doc.')).toBeInTheDocument();
  });

  it('omits the note element when absent', () => {
    const { container } = render(<DocFrame {...BASE} />);
    expect(container.querySelector('.artifact-note')).toBeNull();
  });

  it('labels the screen via data-screen-label', () => {
    const { container } = render(<DocFrame {...BASE} />);
    expect(container.querySelector('section')).toHaveAttribute('data-screen-label', 'Test');
  });
});
