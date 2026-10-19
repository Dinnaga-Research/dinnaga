// ABOUTME: Tests the dossier panel renders true lab facts and the "who we are" prose.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataPanel } from './DataPanel';

describe('DataPanel', () => {
  it('renders the dossier rows with Mission, Method, and Validation bar', () => {
    render(<DataPanel />);
    expect(screen.getByText('Mission')).toBeInTheDocument();
    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('Validation bar')).toBeInTheDocument();
  });

  it('renders the founder line and the public on GitHub link', () => {
    render(<DataPanel />);
    expect(screen.getByText('Dinnaga Research is run by David Ryan.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /public on GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/Dinnaga-Research/dinnaga',
    );
  });

  it('does not render anonymous or open source text', () => {
    render(<DataPanel />);
    expect(screen.queryByText(/anonymous/i)).not.toBeInTheDocument();
  });
});
