// ABOUTME: Colophon (/colophon): how the site is built. FOUNDATION: the old copy on the new primitives,
// ABOUTME: so the route compiles and renders; #71's page replaces it.
import { PageHead } from '../../components/PageHead';
import { SITE_SOURCE_URL } from '../../data/links';

export function Colophon() {
  return (
    <div className="dn-page">
      <PageHead title="Colophon" />
      <div className="dn-grid dn-section">
        <div className="dn-grid__body dn-prose">
          <p>
            Built as a static site (React + Vite), hosted on Vercel, typeset in the Dinnaga design system.{' '}
            <a href={SITE_SOURCE_URL}>This site's source is public on GitHub</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
