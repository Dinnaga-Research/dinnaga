// ABOUTME: Tests the Home route composes its sections in order: the hero first, with its one h1.
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { stubObservers } from '../../components/darkroom/testing';
import { Home } from './Home';

// jsdom has no matchMedia, so the run renders its reduced-motion stills; their painter is not needed here.
vi.mock('../../lib/darkroom/paint', () => ({ paintStill: vi.fn(() => null) }));

describe('Home', () => {
  beforeEach(() => stubObservers());
  afterEach(() => vi.unstubAllGlobals());

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
    expect(screen.getByRole('link', { name: 'David Ryan' }).parentElement!.textContent).toBe(
      'Dinnaga Research is run by David Ryan.',
    );
    expect(screen.getByRole('link', { name: 'Browse the library →' })).toHaveAttribute('href', '/atisha');
    expect(container.querySelector('#after-sequence')).not.toBeNull();
  });
});
