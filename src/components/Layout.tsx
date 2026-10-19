// ABOUTME: Shared site chrome around routed pages — nav, footer, CRT overlay.
// ABOUTME: Renders the matched route via <Outlet/>.
import { Outlet } from 'react-router-dom';
import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';

export function Layout() {
  return (
    <div className="site" data-screen-label="Dinnaga">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
      <div className="crt-overlay" aria-hidden="true" />
    </div>
  );
}
