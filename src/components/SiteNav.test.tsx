// ABOUTME: Tests for the route-aware primary navigation.
// ABOUTME: Verifies brand home link and route links render with correct hrefs.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SiteNav } from './SiteNav';

describe('SiteNav', () => {
  it('renders the brand link and route links', () => {
    render(<MemoryRouter><SiteNav /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Dinnaga/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Atisha' })).toHaveAttribute('href', '/atisha');
    expect(screen.getByRole('link', { name: 'How we work' })).toHaveAttribute('href', '/method');
    expect(screen.getByRole('link', { name: 'Colophon' })).toHaveAttribute('href', '/colophon');
    expect(screen.getByRole('link', { name: 'Weekly' })).toHaveAttribute('href', '/weekly');
  });

  it('does not list the hidden artifact shelf', () => {
    render(<MemoryRouter><SiteNav /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: 'ARTIFACTS' })).not.toBeInTheDocument();
  });

  it('renders no LIVE text', () => {
    render(<MemoryRouter><SiteNav /></MemoryRouter>);
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });
});
