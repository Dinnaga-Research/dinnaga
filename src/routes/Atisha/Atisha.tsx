// ABOUTME: Atisha (/atisha, #63): the public library. Page head, then the bar, the state line and the
// ABOUTME: board line as marginalia in column 1, and the register of published Docs in column 2.
import { LibraryRegister } from '../../components/LibraryRegister/LibraryRegister';
import { PageHead } from '../../components/PageHead';
import { DOCS, publishedDocs } from '../../data/docs';
import { ATISHA_PROJECT_URL } from '../../data/links';
import type { DocEntry } from '../../types';
import './Atisha.css';

export function Atisha({ docs = DOCS }: { docs?: DocEntry[] }) {
  const published = publishedDocs(docs);
  return (
    <div className="atisha dn-page">
      <PageHead
        title="Atisha"
        lede="The public library. Every document here was tested before it was published, and says how."
      />
      <div className="atisha__body dn-grid dn-section">
        <div className="atisha__notes dn-grid__label">
          <p className="atisha__bar">
            We only publish what we've used ourselves. When a document relies on someone else's tool, it names the
            tool and links to it.
          </p>
          <p className="atisha__note">
            {published.length === 0
              ? 'Nothing is published here yet. Whitepapers and living documents are planned.'
              : 'Cheat sheets and reports today. Whitepapers and living documents are planned.'}
          </p>
        </div>
        {published.length > 0 && (
          <div className="atisha__register dn-grid__body">
            <LibraryRegister docs={published} headingLevel={2} />
          </div>
        )}
        {/* After the register in reading order; from 760 px it sits under the other notes in column 1. */}
        <p className="atisha__board atisha__note dn-grid__label">
          Plans for Atisha are tracked on the public <a href={ATISHA_PROJECT_URL}>Atisha board</a>.
        </p>
      </div>
    </div>
  );
}
