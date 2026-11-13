// ABOUTME: The upstream URLs the function calls, and fetch-stub routes that answer all of them from the
// ABOUTME: recorded fixtures (the happy path); tests override single routes to break one source.
import { fixtureJson, fixtureText } from './index.js';
import { json, text, type Route } from './fetchStub.js';

export const USER_REPOS =
  'https://api.github.com/users/weytani/repos?type=owner&sort=pushed&per_page=100';
export const ORG_REPOS =
  'https://api.github.com/orgs/Dinnaga-Research/repos?type=public&sort=pushed&per_page=100';
export const GISTS = 'https://api.github.com/users/weytani/gists?per_page=100';
export const FEED = 'https://weytani.substack.com/feed';
export const release = (slug: string) => `https://api.github.com/repos/${slug}/releases/latest`;

const rel200 = fixtureJson('release-latest-200.json') as Record<string, unknown>;
const rel404 = fixtureJson('release-latest-404.json');

/** GitHub: both listings and the four repos that survive the filter at the recorded date. */
export const githubRoutes = (): Record<string, Route> => ({
  [USER_REPOS]: json(fixtureJson('repos-user.json')),
  [ORG_REPOS]: json(fixtureJson('repos-org.json')),
  [GISTS]: json(fixtureJson('gists.json')),
  [release('Dinnaga-Research/dinnaga')]: json(rel404, 404),
  [release('weytani/living-graph')]: json(rel404, 404),
  [release('weytani/d3-lwc-graphql')]: json(rel200),
  [release('weytani/d3-lwc-soql')]: json({ ...rel200, tag_name: 'v1.0.0' }),
});

/** Everything: GitHub and the Substack feed. */
export const allRoutes = (): Record<string, Route> => ({
  ...githubRoutes(),
  [FEED]: text(fixtureText('substack-feed.xml')),
});
