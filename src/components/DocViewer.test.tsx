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

test('scroll-padding-top on the root is set while a doc is mounted and removed on unmount', async () => {
  stubFetch(read('public/artifact-docs/llm-best-practices-copilot-studio.html'));
  const view = render(
    <BrowserRouter>
      <DocViewer docPath="/artifact-docs/llm-best-practices-copilot-studio.html" />
    </BrowserRouter>,
  );
  const host = view.container.querySelector<HTMLElement>('[data-doc-host]')!;
  await waitFor(() => expect(host.getAttribute('aria-busy')).toBe('false'));
  await waitFor(() => expect(document.documentElement.style.scrollPaddingTop).toBe('var(--dn-nav-h)'));
  view.unmount();
  expect(document.documentElement.style.scrollPaddingTop).toBe('');
});

test('clicking an in-doc anchor marks the target, focuses it and updates the hash once', async () => {
  window.history.replaceState(null, '', '/artifacts/llm-best-practices-copilot-studio');
  stubFetch(read('public/artifact-docs/llm-best-practices-copilot-studio.html'));
  const view = render(
    <BrowserRouter>
      <DocViewer docPath="/artifact-docs/llm-best-practices-copilot-studio.html" />
    </BrowserRouter>,
  );
  const host = view.container.querySelector<HTMLElement>('[data-doc-host]')!;
  await waitFor(() => expect(host.getAttribute('aria-busy')).toBe('false'));
  const root = host.shadowRoot!;
  Element.prototype.scrollIntoView = vi.fn();
  const before = window.history.length;
  root.querySelector<HTMLAnchorElement>('a[href="#c07"]')!.click();
  await waitFor(() => expect(window.location.hash).toBe('#c07'));
  const target = root.getElementById('c07')!;
  expect(target.hasAttribute('data-doc-target')).toBe(true);
  expect(root.activeElement).toBe(target);
  expect(window.history.length).toBe(before + 1);
  await new Promise((r) => setTimeout(r, 50)); // let the hash effect for #c07 settle
  root.querySelector<HTMLAnchorElement>('a[href="#c03"]')!.click();
  await waitFor(() => expect(window.location.hash).toBe('#c03'));
  await waitFor(() => expect(root.getElementById('c03')!.hasAttribute('data-doc-target')).toBe(true));
  expect(root.querySelectorAll('[data-doc-target]')).toHaveLength(1);
  expect(root.getElementById('c03')!.hasAttribute('data-doc-target')).toBe(true);
  expect(window.history.length).toBe(before + 2);
});
