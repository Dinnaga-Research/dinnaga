// ABOUTME: Site footer — brand block, route link columns, and bottom meta strip.
// ABOUTME: Links route within the SPA; GitHub column points at public site source and Atisha board.
import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { SITE_SOURCE_URL, ATISHA_PROJECT_URL } from '../data/links';

export function SiteFooter() {
  return (
    <footer className="foot" id="footer">
      <div className="foot-inner">
        <div className="foot-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={28} />
            <span className="word">DINNAGA</span>
          </div>
          <p>Dinnaga Research is run by David Ryan.</p>
        </div>
        <nav className="foot-col" aria-label="The lab">
          <h4>The lab</h4>
          <Link to="/method">How we work</Link>
          <Link to="/atisha">Atisha</Link>
          <Link to="/colophon">Colophon</Link>
        </nav>
        <nav className="foot-col" aria-label="On GitHub">
          <h4>On GitHub</h4>
          <a href={SITE_SOURCE_URL}>Site source</a>
          <a href={ATISHA_PROJECT_URL}>Atisha board</a>
        </nav>
      </div>
      <div className="foot-meta">
        <span>© 2026 DINNAGA</span>
        <span>// VALIDATE · THEN SHARE</span>
      </div>
    </footer>
  );
}
