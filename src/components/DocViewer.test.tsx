// ABOUTME: Tests for the shadow-DOM doc viewer component.
// ABOUTME: Covers: fetch and mount, error handling, no iframe, shadow root content.
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocViewer } from './DocViewer';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function readDoc(name: string): string {
  return readFileSync(join(process.cwd(), `public/artifact-docs/${name}`), 'utf-8');
}

test('mounts SLAMWICH doc in shadow root', async () => {
  const slamwichHtml = readDoc('slamwich-tasting-report.html');

  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(slamwichHtml),
  });

  const { container } = render(<DocViewer docPath="/artifact-docs/slamwich-tasting-report.html" />);

  // Check that the host element was created
  const host = container.querySelector('[data-doc-host]');
  expect(host).toBeTruthy();

  // Check that shadow root was attached
  expect(host?.shadowRoot).toBeTruthy();

  // Check that h1 is present inside shadow root
  const h1 = host?.shadowRoot?.querySelector('h1');
  expect(h1).toBeTruthy();
});

test('shows error message when doc is missing', async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 404,
    text: vi.fn().mockResolvedValue('Not found'),
  });

  render(<DocViewer docPath="/artifact-docs/missing.html" />);

  // Should show error message
  expect(screen.getByText(/didn't load/i)).toBeTruthy();
});

test('shows standalone link in error state', async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 404,
    text: vi.fn().mockResolvedValue('Not found'),
  });

  render(<DocViewer docPath="/artifact-docs/missing.html" />);

  // Should show Open standalone link
  const link = screen.getByRole('link', { name: /open standalone/i });
  expect(link).toBeTruthy();
  expect(link).toHaveAttribute('href', '/artifact-docs/missing.html');
});

test('no iframe anywhere', async () => {
  const slamwichHtml = readDoc('slamwich-tasting-report.html');

  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(slamwichHtml),
  });

  const { container } = render(<DocViewer docPath="/artifact-docs/slamwich-tasting-report.html" />);

  const iframes = container.querySelectorAll('iframe');
  expect(iframes.length).toBe(0);
});

test('has aria-busy while loading', () => {
  const slamwichHtml = readDoc('slamwich-tasting-report.html');

  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(slamwichHtml),
  });

  const { container } = render(<DocViewer docPath="/artifact-docs/slamwich-tasting-report.html" />);

  const host = container.querySelector('[data-doc-host]');
  // Initially should have aria-busy=true during loading
  expect(host?.getAttribute('aria-busy')).toBeTruthy();
});
