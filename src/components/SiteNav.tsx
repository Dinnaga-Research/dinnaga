// ABOUTME: Sticky primary navigation — brand mark + route links.
// ABOUTME: Labels render in the case written in the nav data.
import { Link, NavLink } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { NAV_LINKS } from '../data/navLinks';

export function SiteNav() {
  return (
    <nav className="nav" aria-label="Primary">
      <Link className="nav-brand" to="/">
        <BrandMark size={26} />
        <span className="word">Dinnaga Research</span>
      </Link>
      <div className="nav-links">
        {NAV_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to}>
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
