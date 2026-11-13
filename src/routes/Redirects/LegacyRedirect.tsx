// ABOUTME: Client-side redirects for the old /artifacts and /weekly URLs (#64), replacing the
// ABOUTME: history entry and keeping the query string and hash. Targets come from legacyTarget().
import { Navigate, useLocation } from 'react-router-dom';
import { legacyTarget } from '../../lib/legacyRedirects';
import { NotFound } from '../NotFound/NotFound';

export function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = legacyTarget(pathname);
  if (!target) return <NotFound />;
  return <Navigate replace to={{ pathname: target, search, hash }} />;
}
