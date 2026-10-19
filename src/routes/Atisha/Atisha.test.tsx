// ABOUTME: Tests the Atisha Initiative page — mission, validation bar, catalog states.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { AtishaEntry } from '../../types';
import { Atisha } from './Atisha';

const FIRST_PARTY_ENTRY: AtishaEntry = {
  slug: 'arxiv-prospector',
  title: 'Arxiv Prospector',
  category: 'tool',
  oneLiner: 'Daily triage that scores arxiv papers against a research-to-tools rubric.',
  sourceUrl: 'https://github.com/Dinnaga-Research/atisha/tree/main/validated/arxiv-prospector',
  validatedOn: '2026-06-01',
  whyUseful: 'Turns a noisy feed into a short list of papers worth building from.',
  howValidated: 'Ran it daily for two weeks and shipped tools from its picks.',
  attribution: '',
};

const THIRD_PARTY_ENTRY: AtishaEntry = {
  ...FIRST_PARTY_ENTRY,
  slug: 'whisper-transcribe',
  title: 'Whisper Transcribe',
  oneLiner: 'High-accuracy speech-to-text for meeting notes.',
  attribution: 'OpenAI',
};

describe('Atisha', () => {
  it('renders the heading "Atisha" exactly', () => {
    render(<MemoryRouter><Atisha /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Atisha' })).toBeInTheDocument();
  });

  it('renders both approved paragraphs verbatim', () => {
    render(<MemoryRouter><Atisha /></MemoryRouter>);
    expect(screen.getByText('The public library. Every document here was tested before it was published, and says how.'))
      .toBeInTheDocument();
    expect(screen.getByText('We only publish what we\'ve used ourselves. When a document relies on someone else\'s tool, it names the tool and links to it.'))
      .toBeInTheDocument();
  });

  it('shows the empty-state when the catalog has no entries', () => {
    render(<MemoryRouter><Atisha /></MemoryRouter>);
    // ATISHA_CATALOG ships empty at launch.
    expect(screen.getByText('Nothing is published here yet. Whitepapers and living documents are planned.'))
      .toBeInTheDocument();
    expect(screen.queryByText(/Cheat sheets and reports today/i)).not.toBeInTheDocument();
  });

  it('shows the "Cheat sheets and reports today" line when the catalog has entries', () => {
    render(<MemoryRouter><Atisha entries={[FIRST_PARTY_ENTRY]} /></MemoryRouter>);
    expect(screen.getByText('Cheat sheets and reports today. Whitepapers and living documents are planned.'))
      .toBeInTheDocument();
    expect(screen.queryByText(/Nothing is published here yet/i)).not.toBeInTheDocument();
  });

  it('renders the Atisha board link', () => {
    render(<MemoryRouter><Atisha /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Atisha board/ }))
      .toHaveAttribute('href', 'https://github.com/orgs/Dinnaga-Research/projects/1');
  });

  it('does not render any open-source or genuinely useful text', () => {
    render(<MemoryRouter><Atisha /></MemoryRouter>);
    expect(screen.queryByText(/open-source/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/genuinely useful/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/on the way/i)).not.toBeInTheDocument();
  });

  it('renders a first-party entry card with no attribution span', () => {
    render(<MemoryRouter><Atisha entries={[FIRST_PARTY_ENTRY]} /></MemoryRouter>);
    expect(screen.queryByText(/first validated entries are on the way/i)).not.toBeInTheDocument();
    expect(screen.getByText(FIRST_PARTY_ENTRY.title)).toBeInTheDocument();
    expect(screen.getByText(FIRST_PARTY_ENTRY.oneLiner)).toBeInTheDocument();
    expect(screen.getByText(/How we validated it:/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^source/i }))
      .toHaveAttribute('href', FIRST_PARTY_ENTRY.sourceUrl);
    // attribution === '' → no "via" credit span.
    expect(screen.queryByText(/^via /)).not.toBeInTheDocument();
  });

  it('renders the "via" attribution span for a third-party entry', () => {
    render(<MemoryRouter><Atisha entries={[THIRD_PARTY_ENTRY]} /></MemoryRouter>);
    expect(screen.getByText(`via ${THIRD_PARTY_ENTRY.attribution}`)).toBeInTheDocument();
  });
});
