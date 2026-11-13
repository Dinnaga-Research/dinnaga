// ABOUTME: Tests the footer (#70): the founder line, exactly six links with their targets,
// ABOUTME: no Behind the scenes link, and the computed copyright year.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SiteFooter } from './SiteFooter';

function renderFooter() {
  render(
    <MemoryRouter>
      <SiteFooter />
    </MemoryRouter>,
  );
  return screen.getByRole('contentinfo');
}

describe('SiteFooter', () => {
  it('renders the founder line', () => {
    const footer = renderFooter();
    expect(within(footer).getByText('Dinnaga Research is run by David Ryan.')).toBeInTheDocument();
  });

  it('renders exactly the six links, in order, with their targets', () => {
    const footer = renderFooter();
    expect(within(footer).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Atisha', '/atisha'],
      ['Building', '/building'],
      ['How we test', '/method'],
      ['Colophon', '/colophon'],
      ['Source on GitHub', 'https://github.com/Dinnaga-Research/dinnaga'],
      ['Substack', 'https://weytani.substack.com/'],
    ]);
  });

  it('has no /backstage link', () => {
    const footer = renderFooter();
    expect(footer.querySelector('a[href^="/backstage"]')).toBeNull();
  });

  it('shows the brand as the wordmark and the copyright with the current year', () => {
    const footer = renderFooter();
    expect(within(footer).getByText(`© ${new Date().getFullYear()} Dinnaga Research`)).toBeInTheDocument();
    expect(footer.querySelector('.site-footer__wordmark')?.textContent).toBe('Dinnaga Research');
  });
});
