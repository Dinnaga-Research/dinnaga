// ABOUTME: Tests for the small literal data files: the nav model and the method stages (#70, #71).
import { describe, expect, it } from 'vitest';
import { NAV_LINKS } from './navLinks';
import { METHOD_STAGES } from './method';
import { SUBSTACK_URL } from './links';

describe('NAV_LINKS', () => {
  it('lists Atisha, Building, How we test and Writing, in order', () => {
    expect(NAV_LINKS).toEqual([
      { label: 'Atisha', to: '/atisha' },
      { label: 'Building', to: '/building' },
      { label: 'How we test', to: '/method' },
      { label: 'Writing', to: 'https://weytani.substack.com/', external: true },
    ]);
    expect(SUBSTACK_URL).toBe('https://weytani.substack.com/');
  });
});

describe('METHOD_STAGES', () => {
  it('carries the five stages verbatim from #71', () => {
    expect(METHOD_STAGES).toEqual([
      { name: 'Read', detail: 'Find interesting papers, posts and releases. Queue them.' },
      { name: 'Digest', detail: 'Read them. Write up what actually matters.' },
      { name: 'Ideate', detail: 'Promising ideas get a note worth coming back to.' },
      { name: 'Experiment', detail: 'Build it, try it, see what happens. Most die here.' },
      { name: 'Ship', detail: 'What survives becomes a skill, a tool or a workflow, and a candidate for Atisha.' },
    ]);
  });
});
