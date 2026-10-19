// ABOUTME: Tests for the shared Layout shell — chrome + routed outlet.
// ABOUTME: Verifies nav, footer, and the routed child all render.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <Layout />, children: [{ index: true, element: <p>HOME CONTENT</p> }] }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Layout', () => {
  it('renders the primary nav, the routed child, and the footer', () => {
    renderAt('/');
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText('HOME CONTENT')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('does not render a CRT overlay element', () => {
    const { container } = renderAt('/');
    expect(container.querySelector('.crt-overlay')).not.toBeInTheDocument();
  });
});
