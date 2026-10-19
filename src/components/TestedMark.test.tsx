// ABOUTME: Tests for the TestedMark and TestedLine components.
// ABOUTME: Covers rendering, accessibility and styling hooks.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestedMark, TestedLine } from './TestedMark';

describe('TestedMark', () => {
  it('renders a hidden span with class tested-mark', () => {
    const { container } = render(<TestedMark />);
    const mark = container.querySelector('.tested-mark');
    expect(mark).toBeTruthy();
    expect(mark).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('TestedLine', () => {
  it('renders a paragraph with class tested-line containing a mark and text', () => {
    render(<TestedLine>Tested with Playwright in chromium</TestedLine>);
    const line = screen.getByText(/Tested with Playwright/);
    expect(line).toHaveClass('tested-line');
    expect(line.tagName).toBe('P');
  });

  it('marks the content accessible by the text alone', () => {
    render(<TestedLine>Tested with Playwright in chromium</TestedLine>);
    const line = screen.getByText(/Tested with Playwright/);
    expect(line.textContent).toBe('Tested with Playwright in chromium');
  });
});
