// ABOUTME: Tests the Layout shell: skip link first, nav, one main, footer, and the per-route
// ABOUTME: metadata (#70) it applies on every location change: title, one description, robots on noindex.
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <p>ROUTE CONTENT</p> },
          { path: '*', element: <p>ROUTE CONTENT</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const description = () => document.head.querySelectorAll('meta[name="description"]');
const robots = () => document.head.querySelectorAll('meta[name="robots"]');

beforeEach(() => {
  document.head.innerHTML = '<title>Dinnaga Research</title><meta name="description" content="default" />';
});

describe('Layout', () => {
  it('renders the skip link first, then the primary nav, one main, the routed child and the footer', () => {
    renderAt('/');
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#main');
    const focusable = document.body.querySelectorAll('a[href], button, [tabindex]');
    expect(focusable[0]).toBe(skip);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(document.querySelectorAll('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByText('ROUTE CONTENT')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('sets the title and the one description for the route, with no robots meta on indexed routes', () => {
    renderAt('/atisha');
    expect(document.title).toBe('Atisha · Dinnaga Research');
    expect(description()).toHaveLength(1);
    expect(description()[0]).toHaveAttribute(
      'content',
      'The public library. Every document here was tested before it was published, and says how.',
    );
    expect(robots()).toHaveLength(0);
  });

  it('adds robots noindex on a noindex route and removes it after a client navigation away', async () => {
    const router = renderAt('/backstage');
    expect(document.title).toBe('Behind the scenes · Dinnaga Research');
    expect(robots()).toHaveLength(1);
    expect(robots()[0]).toHaveAttribute('content', 'noindex');
    await act(() => router.navigate('/atisha'));
    expect(document.title).toBe('Atisha · Dinnaga Research');
    expect(robots()).toHaveLength(0);
    expect(description()).toHaveLength(1);
  });

  it('creates the description meta when the document has none', () => {
    document.head.innerHTML = '';
    renderAt('/no-such-page');
    expect(document.title).toBe('Page not found · Dinnaga Research');
    expect(description()).toHaveLength(1);
    expect(robots()).toHaveLength(1);
  });
});
