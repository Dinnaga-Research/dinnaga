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
  await waitFor(() => expect(document.documentElement.style.scrollPaddingTop).toBe('calc(var(--dn-nav-h) + var(--doc-bar-h))'));
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

// Quartz callouts and print theme (#50, #51)
import userEvent from '@testing-library/user-event';
import { fixtureUrl, stubFixtureFetch } from '../test/quartzFixture';

function stubMatchMedia() {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

async function mountQuartz() {
  if (typeof window.matchMedia !== 'function') stubMatchMedia();
  stubFixtureFetch();
  const docPath = fixtureUrl('build-b', 'index.html').href;
  const utils = render(
    <BrowserRouter>
      <DocViewer docPath={docPath} />
    </BrowserRouter>,
  );
  const host = utils.container.querySelector<HTMLElement>('[data-doc-host]')!;
  await waitFor(() => expect(host.getAttribute('aria-busy')).toBe('false'));
  return host;
}

test('Quartz: clicking a collapsed callout title opens it, and again closes it', async () => {
  const host = await mountQuartz();
  const root = within(host.shadowRoot as unknown as HTMLElement);
  const title = root.getByRole('button', { name: /Collapsed callout/ });
  const callout = title.closest('.callout')!;
  expect(title.getAttribute('aria-expanded')).toBe('false');
  await userEvent.click(title);
  expect(callout.classList.contains('is-collapsed')).toBe(false);
  expect(title.getAttribute('aria-expanded')).toBe('true');
  await userEvent.click(title);
  expect(callout.classList.contains('is-collapsed')).toBe(true);
});

test('Quartz: Enter opens and Space closes a focused callout title', async () => {
  const host = await mountQuartz();
  const root = within(host.shadowRoot as unknown as HTMLElement);
  const title = root.getByRole('button', { name: /Collapsed callout/ });
  title.focus();
  await userEvent.keyboard('{Enter}');
  expect(title.getAttribute('aria-expanded')).toBe('true');
  await userEvent.keyboard(' ');
  expect(title.getAttribute('aria-expanded')).toBe('false');
});

test('Quartz: a nested callout toggles on its own without toggling the outer one', async () => {
  const host = await mountQuartz();
  const root = within(host.shadowRoot as unknown as HTMLElement);
  const outer = root.getByRole('button', { name: /Collapsed callout/ });
  await userEvent.click(outer);
  const inner = root.getByRole('button', { name: /Nested callout/ });
  await userEvent.click(inner);
  expect(inner.getAttribute('aria-expanded')).toBe('true');
  expect(outer.getAttribute('aria-expanded')).toBe('true');
});

test('Quartz: the host is saved-theme dark, and print switches it to light and back', async () => {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  const mql = {
    matches: false,
    media: 'print',
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.push(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
      listeners.splice(listeners.indexOf(fn), 1);
    },
  };
  vi.stubGlobal('matchMedia', (q: string) => (q === 'print' ? mql : { ...mql, media: q, matches: false }));
  const host = await mountQuartz();
  expect(host.getAttribute('saved-theme')).toBe('dark');
  mql.matches = true;
  listeners.forEach((fn) => fn({ matches: true }));
  expect(host.getAttribute('saved-theme')).toBe('light');
  window.dispatchEvent(new Event('afterprint'));
  mql.matches = false;
  window.dispatchEvent(new Event('afterprint'));
  expect(host.getAttribute('saved-theme')).toBe('dark');
  window.dispatchEvent(new Event('beforeprint'));
  expect(host.getAttribute('saved-theme')).toBe('light');
});

test('Quartz: print listeners are removed on unmount', async () => {
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  stubMatchMedia();
  stubFixtureFetch();
  const utils = render(
    <BrowserRouter>
      <DocViewer docPath={fixtureUrl('build-b', 'index.html').href} />
    </BrowserRouter>,
  );
  const host = utils.container.querySelector<HTMLElement>('[data-doc-host]')!;
  await waitFor(() => expect(host.getAttribute('aria-busy')).toBe('false'));
  const added = add.mock.calls.filter(([t]) => t === 'beforeprint' || t === 'afterprint').length;
  expect(added).toBe(2);
  utils.unmount();
  const removed = remove.mock.calls.filter(([t]) => t === 'beforeprint' || t === 'afterprint').length;
  expect(removed).toBe(2);
  add.mockRestore();
  remove.mockRestore();
});
