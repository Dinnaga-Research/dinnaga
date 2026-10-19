// ABOUTME: Tests the Colophon page renders the about-the-lab content.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Colophon } from './Colophon';

describe('Colophon', () => {
  it('renders the colophon heading and how the site is built', () => {
    render(<Colophon />);
    expect(screen.getByRole('heading', { name: /Colophon/i })).toBeInTheDocument();
    expect(screen.getByText(/Built as a static site/i)).toBeInTheDocument();
    expect(screen.getByText(/hosted on Vercel/i)).toBeInTheDocument();
  });

  it('renders the link to the site source on GitHub', () => {
    render(<Colophon />);
    expect(screen.getByRole('link', { name: /public on GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/Dinnaga-Research/dinnaga',
    );
  });

  it('does not render anonymous text', () => {
    render(<Colophon />);
    expect(screen.queryByText(/anonymous/i)).not.toBeInTheDocument();
  });
});
