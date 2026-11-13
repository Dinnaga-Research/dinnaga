// ABOUTME: Tests the 404 page (#70): the h1, the one sentence, and its links to / and /atisha.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from './NotFound';

describe('NotFound', () => {
  it('renders the h1, the sentence and both links', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Page not found$/);
    expect(screen.getByText(/There's nothing at this address/).textContent).toBe(
      "There's nothing at this address. Try the homepage or Atisha.",
    );
    expect(screen.getByRole('link', { name: 'homepage' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Atisha' })).toHaveAttribute('href', '/atisha');
  });

  it('drops the old theme vocabulary', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/transmission|signal|404/i)).toBeNull();
  });
});
