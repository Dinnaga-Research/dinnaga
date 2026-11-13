// ABOUTME: Tests the Home route composes its sections in order: the hero first, with its one h1.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Home } from './Home';

describe('Home', () => {
  it('renders the hero with the headline, the lede, the founder line and the library link', () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Living documents for engineers who code with AI',
    );
    expect(
      screen.getByText(
        'Dinnaga Research reads the papers, podcasts and vendor docs, tests what they claim, and publishes what holds up.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Dinnaga Research is run by David Ryan.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse the library →' })).toHaveAttribute('href', '/atisha');
    expect(container.querySelector('#after-sequence')).not.toBeNull();
  });
});
