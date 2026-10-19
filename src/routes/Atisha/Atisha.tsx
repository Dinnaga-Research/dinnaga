// ABOUTME: Atisha public library route (/atisha) — the validated-reference front door.
// ABOUTME: Renders mission, the state line based on catalog, and the catalog (or an honest empty-state).
import { ATISHA_CATALOG } from '../../data/atishaCatalog';
import { ATISHA_PROJECT_URL } from '../../data/links';
import type { AtishaEntry } from '../../types';

export function Atisha({ entries = ATISHA_CATALOG }: { entries?: AtishaEntry[] } = {}) {
  return (
    <section className="section" id="atisha" data-screen-label="Atisha">
      <header className="section-head">
        <span className="section-eye">// THE PUBLIC LIBRARY</span>
        <h1 className="section-title">Atisha</h1>
      </header>
      <p className="panel-body">
        The public library. Every document here was tested before it was published, and says how.
      </p>
      <p className="panel-body">
        We only publish what we've used ourselves. When a document relies on someone else's tool, it
        names the tool and links to it.
      </p>

      <p className="panel-body">
        {entries.length === 0
          ? 'Nothing is published here yet. Whitepapers and living documents are planned.'
          : 'Cheat sheets and reports today. Whitepapers and living documents are planned.'}
      </p>

      <p className="panel-body">
        Plans for Atisha are tracked on the public{' '}
        <a href={ATISHA_PROJECT_URL}>Atisha board</a>.
      </p>

      {entries.length > 0 && (
        <ul className="atisha-catalog">
          {entries.map((e) => (
            <li className="atisha-entry" key={e.slug}>
              <span className="atisha-cat">{e.category.toUpperCase()}</span>
              <h3 className="atisha-title">{e.title}</h3>
              <p className="atisha-oneliner">{e.oneLiner}</p>
              <p className="atisha-why">{e.whyUseful}</p>
              <p className="atisha-howvalidated">How we validated it: {e.howValidated}</p>
              <footer className="atisha-foot">
                <a href={e.sourceUrl}>source →</a>
                {e.attribution && <span className="atisha-attr">via {e.attribution}</span>}
                <span className="atisha-date">validated {e.validatedOn}</span>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
