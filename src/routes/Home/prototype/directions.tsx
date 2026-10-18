// ABOUTME: PROTOTYPE (throwaway) — three structurally different homepage directions for the refresh:
// ABOUTME: A Register (type set A), B Reading room (set C, amber), C Console (set B, pixel terminal).
import { Link } from 'react-router-dom';
import { BrandMark } from '../../../components/BrandMark';
import { Terminal } from '../../../components/Terminal';
import { BOOT_LINES, FOOTER_LINKS, FOUNDER, LIBRARY, NAV, THESIS, useLivingDocs, type LibraryDoc } from './content';

function useDocs() {
  return [...LIBRARY, ...useLivingDocs(3)];
}

const fmt = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/* ── A: Register ─────────────────────────────────────────────── */
export function DirectionA() {
  const docs = useDocs();
  return (
    <div className="dir dir-a">
      <header className="a-head">
        <Link to="/" className="a-brand">
          <BrandMark size={28} />
          <span>Dinnaga Research</span>
        </Link>
        <nav aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} to={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main">
        <section className="a-hero">
          <div className="a-hero-copy">
            <h1>{THESIS}</h1>
            <p className="a-founder">{FOUNDER}</p>
            <Link className="a-cta" to="/atisha">
              Browse the library →
            </Link>
          </div>
          <div className="a-hero-term">
            <Terminal bootLines={BOOT_LINES} />
          </div>
        </section>
        <section className="a-library" aria-labelledby="a-lib">
          <div className="a-lib-head">
            <h2 id="a-lib">The public library</h2>
            <p>
              Everything here was tested before it was published. The <span className="a-tested-key" aria-hidden="true" /> line
              says how.
            </p>
          </div>
          <ol className="a-register">
            {docs.map((d) => (
              <li key={d.href}>
                <time dateTime={d.date}>{fmt(d.date)}</time>
                <div className="a-entry">
                  <Link to={d.href}>{d.title}</Link>
                  <p>{d.summary}</p>
                  <p className="a-tested">{d.tested}</p>
                </div>
                <span className="a-kind">{d.kind}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="a-foot">
        <div>
          <p className="a-foot-name">Dinnaga Research</p>
          <p>{FOUNDER}</p>
        </div>
        <ul>
          {FOOTER_LINKS.map((l) => (
            <li key={l.label}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <p className="a-foot-note">Set in Archivo, Atkinson Hyperlegible Next and JetBrains Mono.</p>
      </footer>
    </div>
  );
}
DirectionA.label = 'Register · set A · lime = tested';

/* ── B: Reading room ─────────────────────────────────────────── */
export function DirectionB() {
  const docs = useDocs();
  const [lead, ...rest] = docs as [LibraryDoc, ...LibraryDoc[]];
  return (
    <div className="dir dir-b">
      <header className="b-head">
        <Link to="/" className="b-brand">
          <BrandMark size={34} />
          <span>Dinnaga Research</span>
        </Link>
        <nav aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} to={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main">
        <section className="b-intro">
          <h1>{THESIS}</h1>
          <p>{FOUNDER}</p>
        </section>
        <section className="b-lead" aria-label="Featured document">
          <p className="b-meta">
            {lead.kind} · {fmt(lead.date)}
          </p>
          <h2>
            <Link to={lead.href}>{lead.title}</Link>
          </h2>
          <p className="b-lead-summary">{lead.summary}</p>
          <p className="b-tested">{lead.tested}</p>
        </section>
        <section className="b-more" aria-labelledby="b-more">
          <h2 id="b-more" className="b-section">
            More from the library
          </h2>
          <ul>
            {rest.map((d) => (
              <li key={d.href}>
                <p className="b-meta">
                  {d.kind} · {fmt(d.date)}
                </p>
                <h3>
                  <Link to={d.href}>{d.title}</Link>
                </h3>
                <p>{d.summary}</p>
                <p className="b-tested">{d.tested}</p>
              </li>
            ))}
          </ul>
        </section>
        <details className="b-backstage">
          <summary>Behind the scenes</summary>
          <div className="b-term">
            <Terminal bootLines={BOOT_LINES} />
          </div>
        </details>
      </main>
      <footer className="b-foot">
        <p>
          Dinnaga Research. {FOUNDER}{' '}
          {FOOTER_LINKS.map((l, i) => (
            <span key={l.label}>
              {i > 0 && ' · '}
              <a href={l.href}>{l.label}</a>
            </span>
          ))}
        </p>
        <p>Set in Archivo, IBM Plex Sans and Commit Mono.</p>
      </footer>
    </div>
  );
}
DirectionB.label = 'Reading room · set C · amber';

/* ── C: Console ──────────────────────────────────────────────── */
export function DirectionC() {
  const docs = useDocs();
  const kinds = ['Cheat sheet', 'Report', 'Living document'] as const;
  return (
    <div className="dir dir-c">
      <header className="c-head">
        <Link to="/" className="c-brand">
          <BrandMark size={22} />
          <span>dinnaga research</span>
        </Link>
        <nav aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} to={n.href}>
              {n.label.toLowerCase()}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main">
        <section className="c-hero">
          <div className="c-hero-copy">
            <h1>{THESIS}</h1>
            <p>{FOUNDER}</p>
          </div>
          <div className="c-hero-term">
            <Terminal bootLines={BOOT_LINES} />
          </div>
        </section>
        <section className="c-dir" aria-labelledby="c-lib">
          <h2 id="c-lib">
            atisha/ <span>{docs.length} public docs</span>
          </h2>
          <div className="c-cols">
            {kinds.map((k) => {
              const list = docs.filter((d) => d.kind === k);
              if (!list.length) return null;
              return (
                <div key={k} className="c-col">
                  <h3>
                    {k.toLowerCase().replace(' ', '-')}s/ <span>{list.length}</span>
                  </h3>
                  <ul>
                    {list.map((d) => (
                      <li key={d.href}>
                        <time dateTime={d.date}>{d.date}</time>
                        <Link to={d.href}>{d.title}</Link>
                        <p>{d.tested}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <footer className="c-foot">
        <span>dinnaga research, 2026</span>
        {FOOTER_LINKS.map((l) => (
          <a key={l.label} href={l.href}>
            {l.label.toLowerCase()}
          </a>
        ))}
        <span>set in anybody, inclusive sans, martian mono, departure mono</span>
      </footer>
    </div>
  );
}
DirectionC.label = 'Console · set B · pixel terminal';
