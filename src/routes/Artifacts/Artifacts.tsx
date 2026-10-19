// ABOUTME: Artifacts index route (/artifacts) — the shelf of standalone research documents.
// ABOUTME: Lists every ArtifactEntry and links each one into the /artifacts/:slug viewer.
import { Link } from 'react-router-dom';
import { ARTIFACTS } from '../../data/artifacts';

export function Artifacts() {
  return (
    <section className="section" id="artifacts" data-screen-label="Artifacts">
      <header className="section-head">
        <span className="section-eye">Artifacts</span>
        <h1 className="section-title">Documents off the bench.</h1>
      </header>
      <p className="panel-body">
        Standalone reports and syntheses produced by lab projects — complete documents, readable in
        place or opened raw. Unlisted channel — the nav forgot this shelf; the home terminal
        remembers the words.
      </p>
      <ul className="artifact-index">
        {ARTIFACTS.map((a) => (
          <li className="artifact-entry" key={a.slug}>
            <span className="artifact-project">{a.project}</span>
            <h3 className="artifact-title">
              <Link to={`/artifacts/${a.slug}`}>{a.title}</Link>
            </h3>
            <p className="artifact-oneliner">{a.oneLiner}</p>
            <footer className="artifact-foot">
              <span className="artifact-date">published {a.published}</span>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}
