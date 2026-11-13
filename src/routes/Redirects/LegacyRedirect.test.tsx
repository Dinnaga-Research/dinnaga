// ABOUTME: Tests LegacyRedirect (#64): each old URL replaces itself with its new path, keeping the
// ABOUTME: query string and the hash, so the old URL leaves no history entry.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LegacyRedirect } from './LegacyRedirect';

function land(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/artifacts', element: <LegacyRedirect /> },
      { path: '/artifacts/:slug', element: <LegacyRedirect /> },
      { path: '/weekly', element: <LegacyRedirect /> },
      { path: '/weekly/:date', element: <LegacyRedirect /> },
      { path: '*', element: <p>landed</p> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  const { pathname, search, hash } = router.state.location;
  return { to: pathname + search + hash, action: router.state.historyAction };
}

describe('LegacyRedirect', () => {
  it.each([
    ['/artifacts', '/backstage'],
    ['/artifacts/slamwich-tasting-report', '/atisha/slamwich-tasting-report'],
    ['/artifacts/llm-best-practices-copilot-studio#c07', '/atisha/llm-best-practices-copilot-studio#c07'],
    ['/artifacts/no-such-doc', '/backstage/no-such-doc'],
    ['/weekly', '/backstage/weekly'],
    ['/weekly/2026-08-08?x=1', '/backstage/weekly/2026-08-08?x=1'],
  ])('%s replaces itself with %s', (from, to) => {
    expect(land(from)).toEqual({ to, action: 'REPLACE' });
  });
});
