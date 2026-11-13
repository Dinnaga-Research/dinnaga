// ABOUTME: Primary navigation (#70, spec §7.1): the brand, then Atisha, Building, How we test and Writing.
// ABOUTME: Below 700 px the links wrap under the brand; nothing is hidden and there is no menu button.
import { Link, NavLink } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { NAV_LINKS } from '../data/navLinks';

export function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Primary">
      <Link className="site-nav__brand" to="/">
        <BrandMark size={24} />
        <span className="site-nav__word">Dinnaga Research</span>
      </Link>
      <div className="site-nav__links">
        {NAV_LINKS.map((l) =>
          l.external ? (
            <a key={l.to} href={l.to}>
              {l.label}
              <span className="site-nav__ext" aria-hidden="true">
                ↗
              </span>
            </a>
          ) : (
            <NavLink key={l.to} to={l.to}>
              {l.label}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  );
}
