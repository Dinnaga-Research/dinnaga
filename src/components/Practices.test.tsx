// ABOUTME: Tests for the Practices section listing the lab's two pillars and ethos.
// ABOUTME: Verifies the section title, the three card titles, and accordion expand-on-click.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Practices } from './Practices';

describe('Practices', () => {
  it('renders the three practice cards with updated titles', () => {
    render(<Practices />);
    expect(screen.getByText('How the lab works.')).toBeInTheDocument();
    expect(screen.getByText('What is public')).toBeInTheDocument();
    expect(screen.getByText('Project Planning')).toBeInTheDocument();
    expect(screen.getByText('Atisha')).toBeInTheDocument();
  });

  it('shows only the summary by default and reveals the body on click', async () => {
    render(<Practices />);
    const card = screen.getByText('Project Planning').closest('.practice') as HTMLElement;

    expect(card).not.toHaveClass('is-open');
    expect(card.textContent).toContain('How the work happens: Read → Digest');
    expect(card.textContent).not.toContain('We read papers and releases');

    await userEvent.click(card);

    expect(card).toHaveClass('is-open');
    expect(card.textContent).toContain('We read papers and releases');
  });

  it('renders the new first card with updated public on GitHub text', () => {
    render(<Practices />);
    expect(screen.getByText('This site\'s source and the Atisha board are public on GitHub.'))
      .toBeInTheDocument();
  });

  it('renders the updated third card with Atisha as the title', () => {
    render(<Practices />);
    expect(screen.getByText('The public library, where tested documents are published.'))
      .toBeInTheDocument();
  });
});
