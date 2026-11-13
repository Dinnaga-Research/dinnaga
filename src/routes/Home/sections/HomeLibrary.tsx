// ABOUTME: The library on the homepage (#68): the latest 6 published Docs in /atisha's register, so the two never
// ABOUTME: disagree; "Everything in Atisha →" only past six; the whole section absent when nothing is published.
import { Link } from 'react-router-dom';
import { LibraryRegister } from '../../../components/LibraryRegister/LibraryRegister';
import { DOCS, publishedDocs } from '../../../data/docs';
import type { DocEntry } from '../../../types';
import '../Home.css';

const SHOWN = 6;

export function HomeLibrary({ docs = DOCS }: { docs?: DocEntry[] }) {
  const published = publishedDocs(docs);
  if (published.length === 0) return null;

  return (
    <section className="dn-page" aria-labelledby="home-library-h">
      <div className="dn-section dn-grid home-library">
        <div className="dn-grid__label">
          <h2 id="home-library-h">The library</h2>
          <p className="home-section__intro">Each document says how it was tested.</p>
        </div>
        <div className="dn-grid__body">
          <LibraryRegister docs={published.slice(0, SHOWN)} headingLevel={3} />
          {published.length > SHOWN && (
            <p className="home-section__more">
              <Link to="/atisha">Everything in Atisha →</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
