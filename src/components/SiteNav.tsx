// ABOUTME: Sticky primary navigation — brand mark + route links.
// ABOUTME: Signature motion: a green square races L→R behind the clip-reveal on mount.
import { Fragment, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { NAV_LINKS } from '../data/navLinks';

export function SiteNav() {
  // Honour the visitor's reduced-motion preference: never mount the
  // travelling green square if the OS asks us to minimise motion.
  const [showSquare, setShowSquare] = useState(
    () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (!showSquare) return;
    const t = setTimeout(() => setShowSquare(false), 1300);
    return () => clearTimeout(t);
  }, [showSquare]);

  return (
    <Fragment>
      {showSquare && <div className="green-square" aria-hidden="true" />}
      <nav className="nav" aria-label="Primary">
        <Link className="nav-brand" to="/">
          <BrandMark size={26} />
          <span className="word">DINNAGA</span>
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to}>
              {l.label.toUpperCase()}
            </NavLink>
          ))}
        </div>
      </nav>
    </Fragment>
  );
}
