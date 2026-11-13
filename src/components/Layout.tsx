// ABOUTME: Shared site chrome around routed pages: skip link, nav, the one <main>, footer.
// ABOUTME: On every location change it applies the route's metadata (#70): title, description, robots.
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';
import { metaFor, type RouteMeta } from '../lib/routeMeta';

function applyMeta({ title, description, noindex }: RouteMeta) {
  document.title = title;
  let desc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!desc) {
    desc = document.createElement('meta');
    desc.name = 'description';
    document.head.appendChild(desc);
  }
  desc.content = description;
  const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (noindex && !robots) {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
  } else if (!noindex && robots) {
    robots.remove();
  }
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    applyMeta(metaFor(pathname));
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
