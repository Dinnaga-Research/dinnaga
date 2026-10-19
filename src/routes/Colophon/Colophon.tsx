// ABOUTME: Colophon route (/colophon) — about the lab: founder attribution and how the site is built.
// ABOUTME: States the founder and how the site is made.
import { SITE_SOURCE_URL } from '../../data/links';

export function Colophon() {
  return (
    <section className="section" id="colophon" data-screen-label="Colophon">
      <header className="section-head">
        <span className="section-eye">// COLOPHON</span>
        <h1 className="section-title">Colophon.</h1>
      </header>
      <div className="panel-body-wrap">
        <p className="panel-body">
          Built as a static site (React + Vite), hosted on Vercel, typeset in the Dinnaga design
          system. <a href={SITE_SOURCE_URL}>This site's source is public on GitHub</a>.
        </p>
      </div>
    </section>
  );
}
