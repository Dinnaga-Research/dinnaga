// ABOUTME: Tests the living rows (#66): a repository, gist or post as one register row, with the
// ABOUTME: site's date format, the owner label, the stars rule and the release, links in the same tab.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LivingGist, LivingPost, LivingRepo } from '../../lib/living/contract';
import { RepoRow } from './RepoRow';
import { GistRow } from './GistRow';
import { PostRow } from './PostRow';
import { livingDate, repoMeta } from './format';

const REPO: LivingRepo = {
  owner: 'weytani',
  name: 'living-graph',
  url: 'https://github.com/weytani/living-graph',
  description: 'Alfred-inspired agentic maintenance system for Obsidian graphs',
  pushedAt: '2026-10-18T14:33:49Z',
  stars: 0,
  release: null,
};

function renderRow(row: React.ReactElement) {
  render(<ul>{row}</ul>);
  return screen.getByRole('listitem');
}

describe('livingDate', () => {
  it("uses the site's day month year format, in UTC", () => {
    expect(livingDate('2026-09-09T10:00:00Z')).toBe('9 Sep 2026');
    expect(livingDate('2026-11-12T23:59:59Z')).toBe('12 Nov 2026');
    expect(livingDate('2024-12-18T05:20:21.000Z')).toBe('18 Dec 2024');
    expect(livingDate('2026-01-01T00:30:00+02:00')).toBe('31 Dec 2025');
  });

  it('passes through a date it cannot read', () => {
    expect(livingDate('soon')).toBe('soon');
  });
});

describe('repoMeta: the stars rule', () => {
  it('gives no stars text for 0, "1 star" for 1, "3 stars" for 3', () => {
    expect(repoMeta({ ...REPO, stars: 0 })).toBe('Pushed 18 Oct 2026');
    expect(repoMeta({ ...REPO, stars: 1 })).toBe('Pushed 18 Oct 2026 · 1 star');
    expect(repoMeta({ ...REPO, stars: 3 })).toBe('Pushed 18 Oct 2026 · 3 stars');
  });

  it('adds the release after the stars', () => {
    expect(repoMeta({ ...REPO, release: 'v0.2.0' })).toBe('Pushed 18 Oct 2026 · release v0.2.0');
    expect(repoMeta({ ...REPO, stars: 2, release: 'v1.0' })).toBe('Pushed 18 Oct 2026 · 2 stars · release v1.0');
  });
});

describe('RepoRow', () => {
  it('shows the name as a same-tab link, the description and the meta line', () => {
    const row = renderRow(<RepoRow repo={{ ...REPO, stars: 3, release: 'v0.2.0' }} />);
    const link = within(row).getByRole('link', { name: 'living-graph' });
    expect(link).toHaveAttribute('href', 'https://github.com/weytani/living-graph');
    expect(link).not.toHaveAttribute('target');
    expect(within(row).getByText('Alfred-inspired agentic maintenance system for Obsidian graphs')).toBeInTheDocument();
    expect(within(row).getByText('Pushed 18 Oct 2026 · 3 stars · release v0.2.0')).toBeInTheDocument();
  });

  it('has no owner label for weytani', () => {
    const own = renderRow(<RepoRow repo={REPO} />);
    expect(own.textContent).not.toContain('weytani');
  });

  it('labels any other owner', () => {
    const org = renderRow(<RepoRow repo={{ ...REPO, owner: 'Dinnaga-Research', name: 'dinnaga' }} />);
    expect(within(org).getByText('Dinnaga-Research')).toBeInTheDocument();
    expect(within(org).getByRole('link', { name: 'dinnaga' })).toBeInTheDocument();
  });

  it('leaves out an empty description', () => {
    const row = renderRow(<RepoRow repo={{ ...REPO, description: '' }} />);
    expect(row.querySelectorAll('p')).toHaveLength(2); // the title and the meta line
  });
});

describe('GistRow', () => {
  it('shows the title as a same-tab link and "Updated <date>"', () => {
    const gist: LivingGist = {
      title: 'fixture-notes.md',
      url: 'https://gist.github.com/weytani/0000000000000000000000000000000a',
      updatedAt: '2026-10-06T01:30:57Z',
    };
    const row = renderRow(<GistRow gist={gist} />);
    const link = within(row).getByRole('link', { name: 'fixture-notes.md' });
    expect(link).toHaveAttribute('href', gist.url);
    expect(link).not.toHaveAttribute('target');
    expect(within(row).getByText('Updated 6 Oct 2026')).toBeInTheDocument();
  });
});

describe('PostRow', () => {
  it('shows the title as a same-tab link and the date', () => {
    const post: LivingPost = {
      title: 'The coming storm',
      url: 'https://weytani.substack.com/p/the-coming-storm',
      publishedAt: '2026-10-11T05:39:24.000Z',
    };
    const row = renderRow(<PostRow post={post} />);
    const link = within(row).getByRole('link', { name: 'The coming storm' });
    expect(link).toHaveAttribute('href', post.url);
    expect(link).not.toHaveAttribute('target');
    expect(within(row).getByText('11 Oct 2026')).toBeInTheDocument();
  });
});
