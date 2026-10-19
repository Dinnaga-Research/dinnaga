// ABOUTME: Tests the /artifacts index page — renders every shelf entry with its
// ABOUTME: metadata and links each title into the /artifacts/:slug viewer.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Artifacts } from './Artifacts';

describe('Artifacts', () => {
  it('renders the section heading', () => {
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByText('Artifacts')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the seed entry with title, project, published date, and one-liner', () => {
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByText('SLAMWICH Tasting Report')).toBeInTheDocument();
    expect(screen.getByText('Slamwich')).toBeInTheDocument();
    expect(screen.getByText(/published 2026-08-08/)).toBeInTheDocument();
    expect(screen.getByText(/84-dish portfolio test kitchen/)).toBeInTheDocument();
  });

  it('links the seed entry to its viewer page', () => {
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /SLAMWICH Tasting Report/ })).toHaveAttribute(
      'href',
      '/artifacts/slamwich-tasting-report',
    );
  });
});
