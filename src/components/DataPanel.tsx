// ABOUTME: Two-column dossier panel — tabular surface data plus an "about" prose panel.
// ABOUTME: The tabular rows come from src/data/surfaceData.ts; the prose is static copy.
import { SURFACE_DATA } from '../data/surfaceData';
import { SITE_SOURCE_URL } from '../data/links';

export function DataPanel() {
  return (
    <section
      className="section"
      id="about"
      data-screen-label="About panels"
      style={{ padding: 0, borderBottom: 'none' }}
    >
      <div className="data-panels">
        <article className="panel">
          <header className="panel-head">
            <span className="panel-idx">// 04</span>
            <h3 className="panel-title">SURFACE DATA</h3>
          </header>
          <dl className="data-list">
            {SURFACE_DATA.map((r) => (
              <div className="data-row" key={r.idx}>
                <span className="data-idx">{r.idx}</span>
                <dt className="data-label">{r.label}</dt>
                <dd className="data-value">{r.value}</dd>
              </div>
            ))}
          </dl>
          <footer className="panel-foot">
            <span className="chip chip-signal">PUBLIC</span>
            <span>// DINNAGA</span>
          </footer>
        </article>
        <article className="panel">
          <header className="panel-head">
            <span className="panel-idx">// 05</span>
            <h3 className="panel-title">WHO WE ARE</h3>
          </header>
          <p className="panel-body">Dinnaga Research is run by David Ryan.</p>
          <p className="panel-body">
            Named for Dignāga — a philosopher of perception and valid cognition (pramāṇa) who held
            that knowledge belongs to whoever takes the trouble to examine it. That is the bar for
            anything we put our name on.
          </p>
          <ul className="panel-list">
            <li>
              <span className="panel-bullet">▸</span> Validated before it ships.
            </li>
            <li>
              <span className="panel-bullet">▸</span>
              <span>
                {' '}
                <a href={SITE_SOURCE_URL}>This site's source is public on GitHub</a>.
              </span>
            </li>
            <li>
              <span className="panel-bullet">▸</span> Third-party tools we rely on are credited,
              never claimed.
            </li>
            <li>
              <span className="panel-bullet">▸</span> No marketing — only what works.
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
