// ABOUTME: Site footer (#70, spec §7.2): the founder line, exactly six links, the brand as the
// ABOUTME: closing wordmark and the computed copyright. Nothing here links Behind the scenes.
import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { SITE_SOURCE_URL, SUBSTACK_URL } from '../data/links';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer dn-page" id="footer">
      <div className="site-footer__grid dn-grid">
        <p className="site-footer__founder dn-grid__label">Dinnaga Research is run by David Ryan.</p>
        <div className="site-footer__links dn-grid__body">
          <ul>
            <li>
              <Link to="/atisha">Atisha</Link>
            </li>
            <li>
              <Link to="/building">Building</Link>
            </li>
            <li>
              <Link to="/method">How we test</Link>
            </li>
          </ul>
          <ul>
            <li>
              <Link to="/colophon">Colophon</Link>
            </li>
            <li>
              <a href={SITE_SOURCE_URL}>Source on GitHub</a>
            </li>
            <li>
              <a href={SUBSTACK_URL}>Substack</a>
            </li>
          </ul>
        </div>
      </div>
      <p className="site-footer__wordmark">
        <BrandMark size={64} />
        <span>Dinnaga Research</span>
      </p>
      <p className="site-footer__copy dn-label">© {year} Dinnaga Research</p>
    </footer>
  );
}
