// ABOUTME: Tests the homepage's How we test section (#68): h2, body and link verbatim, the link to /method, and the
// ABOUTME: number in the link text derived from the stage count.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { METHOD_STAGES, type MethodStage } from '../../../data/method';
import { HowWeTest } from './HowWeTest';

const BODY =
  'We build every idea before we write about it, and most die in the trying. What survives ends up in the library, with a note on how we tested it.';

function renderSection(stages?: MethodStage[]) {
  return render(
    <MemoryRouter>
      <HowWeTest stages={stages} />
    </MemoryRouter>,
  );
}

describe('HowWeTest', () => {
  it('renders the h2, the body and the link verbatim, the link to /method', () => {
    renderSection();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^How we test$/);
    expect(screen.getByText(BODY)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See the five stages →' })).toHaveAttribute('href', '/method');
  });

  it('the number in the link matches the stage count', () => {
    expect(METHOD_STAGES).toHaveLength(5);
    renderSection(METHOD_STAGES.slice(0, 3));
    expect(screen.getByRole('link', { name: 'See the three stages →' })).toHaveAttribute('href', '/method');
  });
});
