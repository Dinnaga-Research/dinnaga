// ABOUTME: Tests for the shadow-DOM doc viewer — mounts a real doc, shows the failure state.
// ABOUTME: Queries inside the shadow root with within(); screen does not pierce shadow roots.
import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DocViewer } from './DocViewer';

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf-8');
}

function stubFetch(body: string, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, text: async () => body }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('mounts a real doc inside the shadow root: its h1, no iframe anywhere', async () => {
  stubFetch(read('public/artifact-docs/slamwich-tasting-report.html'));

  const { container } = render(
    <BrowserRouter>
      <DocViewer docPath="/artifact-docs/slamwich-tasting-report.html" />
    </BrowserRouter>,
  );
  const host = container.querySelector<HTMLElement>('[data-doc-host]')!;
  expect(host).toBeTruthy();
  expect(host.childElementCount).toBe(0);

  await waitFor(() => expect(host.shadowRoot).toBeTruthy());
  const root = within(host.shadowRoot as unknown as HTMLElement);
  const h1 = await root.findByRole('heading', {
    level: 1,
    name: /What 84 rebuilds of 28 acclaimed portfolios/,
  });
  expect(h1).toBeTruthy();

  await waitFor(() => expect(host.getAttribute('aria-busy')).toBe('false'));
  expect(document.querySelectorAll('iframe')).toHaveLength(0);
  expect(host.shadowRoot!.querySelectorAll('iframe')).toHaveLength(0);
  // The doc's own <main> is renamed, so the viewer adds no main landmark
  expect(host.shadowRoot!.querySelectorAll('main')).toHaveLength(0);
  expect(host.shadowRoot!.querySelectorAll('doc-main')).toHaveLength(1);
});

test('is aria-busy while loading', () => {
  stubFetch(read('public/artifact-docs/slamwich-tasting-report.html'));
  const { container } = render(
    <BrowserRouter>
      <DocViewer docPath="/artifact-docs/slamwich-tasting-report.html" />
    </BrowserRouter>,
  );
  expect(container.querySelector('[data-doc-host]')?.getAttribute('aria-busy')).toBe('true');
});

test("shows the didn't-load message and standalone link when fetch returns index.html", async () => {
  stubFetch(read('index.html'));

  const { container } = render(
    <BrowserRouter>
      <DocViewer docPath="/artifact-docs/slamwich-tasting-report.html" />
    </BrowserRouter>,
  );

  expect(await screen.findByText("This doc didn't load.")).toBeTruthy();
  const link = screen.getByRole('link', { name: 'Open standalone' });
  expect(link.getAttribute('href')).toBe('/artifact-docs/slamwich-tasting-report.html');
  expect(container.querySelector('[data-doc-host]')).toBeNull();
  expect(document.querySelectorAll('iframe')).toHaveLength(0);
});

test("shows the didn't-load message on a non-OK status and on a network error", async () => {
  stubFetch('Not found', 404);
  const first = render(
    <BrowserRouter>
      <DocViewer docPath="/artifact-docs/missing.html" />
    </BrowserRouter>,
  );
  expect(await first.findByText("This doc didn't load.")).toBeTruthy();
  first.unmount();

  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  const second = render(
    <BrowserRouter>
      <DocViewer docPath="/artifact-docs/missing.html" />
    </BrowserRouter>,
  );
  expect(await second.findByText("This doc didn't load.")).toBeTruthy();
  expect(second.queryByText(/Failed to fetch/)).toBeNull();
});
