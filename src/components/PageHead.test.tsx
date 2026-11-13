// ABOUTME: Tests PageHead (§7.8): the page h1 and an optional lede, with no eyebrow above the h1.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHead } from './PageHead';

describe('PageHead', () => {
  it('renders the h1 and the lede beneath it', () => {
    const { container } = render(<PageHead title="Atisha" lede="The public library." />);
    expect(screen.getByRole('heading', { level: 1, name: 'Atisha' })).toBeInTheDocument();
    const lede = screen.getByText('The public library.');
    expect(lede).toHaveClass('page-head__lede');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('header')?.firstElementChild?.firstElementChild).toBe(h1);
  });

  it('renders no lede when none is given', () => {
    const { container } = render(<PageHead title="Page not found" />);
    expect(container.querySelector('.page-head__lede')).toBeNull();
  });
});
