// ABOUTME: Tests the primary nav (#70): brand, the four links in order with their targets, the
// ABOUTME: Writing link's accessible name, aria-current per section, and no Behind the scenes link.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SiteNav } from './SiteNav';

function renderAt(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SiteNav />
    </MemoryRouter>,
  );
  return screen.getByRole('navigation', { name: 'Primary' });
}

describe('SiteNav', () => {
  it('links the brand, named Dinnaga Research, to /', () => {
    const nav = renderAt();
    expect(within(nav).getByRole('link', { name: 'Dinnaga Research' })).toHaveAttribute('href', '/');
  });

  it('renders Atisha, Building, How we test and Writing, in order, with their targets', () => {
    const nav = renderAt();
    const links = within(nav).getAllByRole('link').slice(1);
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Atisha', '/atisha'],
      ['Building', '/building'],
      ['How we test', '/method'],
      ['Writing↗', 'https://weytani.substack.com/'],
    ]);
  });

  it("gives the Writing link the accessible name 'Writing', with the arrow hidden, in the same tab", () => {
    const nav = renderAt();
    const writing = within(nav).getByRole('link', { name: 'Writing' });
    expect(writing.querySelector('[aria-hidden="true"]')?.textContent).toBe('↗');
    expect(writing).not.toHaveAttribute('target');
  });

  it('marks the current section, including /atisha/:slug, and nothing else', () => {
    let nav = renderAt('/method');
    expect(within(nav).getByRole('link', { name: 'How we test' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Atisha' })).not.toHaveAttribute('aria-current');
    document.body.innerHTML = '';
    nav = renderAt('/atisha/slamwich-tasting-report');
    expect(within(nav).getByRole('link', { name: 'Atisha' })).toHaveAttribute('aria-current', 'page');
  });

  it('never links Behind the scenes', () => {
    const nav = renderAt();
    for (const a of within(nav).getAllByRole('link')) {
      expect(a.getAttribute('href')).not.toMatch(/^\/(backstage|artifacts)/);
    }
  });
});
