// ABOUTME: Shared site chrome around routed pages — nav, footer, cookie banner, CRT overlay.
// ABOUTME: Renders the matched route via <Outlet/>.
import { Outlet, useLocation } from 'react-router-dom';
import { CookieBanner } from './CookieBanner';
import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';

export function Layout() {
  // PROTOTYPE (branch prototype/visual-directions): directions A-C bring their own chrome.
  const loc = useLocation();
  const variant = new URLSearchParams(loc.search).get('variant') ?? 'A';
  if (loc.pathname === '/' && variant !== 'T') return <Outlet />;
  return (
    <div className="site" data-screen-label="Dinnaga">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <CookieBanner />
      <SiteNav />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
      <div className="crt-overlay" aria-hidden="true" />
    </div>
  );
}
