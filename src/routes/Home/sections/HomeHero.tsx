// ABOUTME: The homepage hero (#67): headline, lede, founder line and the one link to the library.
// ABOUTME: FOUNDATION STUB: the frame-sequence run wraps it later; #after-sequence marks where the run ends.
import { Link } from 'react-router-dom';
import { HEADLINE, LEDE } from '../../../data/copy';

export function HomeHero() {
  return (
    <section className="dn-page" aria-labelledby="home-hero-h">
      <div className="page-head dn-grid">
        <div className="dn-grid__body">
          <h1 id="home-hero-h">{HEADLINE}</h1>
          <p className="page-head__lede">{LEDE}</p>
          <p className="page-head__lede">Dinnaga Research is run by David Ryan.</p>
          <p className="page-head__lede">
            <Link to="/atisha">Browse the library →</Link>
          </p>
        </div>
      </div>
      <div id="after-sequence" />
    </section>
  );
}
