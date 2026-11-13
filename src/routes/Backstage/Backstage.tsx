// ABOUTME: Behind the scenes (/backstage): unpublished docs and the paused weekly archive, unlisted.
// ABOUTME: FOUNDATION STUB: the #64 page replaces it.
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/PageHead';
import { unpublishedDocs } from '../../data/docs';

export function Backstage() {
  const docs = unpublishedDocs();
  return (
    <div className="dn-page">
      <PageHead
        title="Behind the scenes"
        lede="Docs we haven't published to Atisha, and the paused weekly archive. These pages are unlisted, and their files are public in the site's source."
      />
      <div className="dn-grid dn-section">
        <div className="dn-grid__body dn-prose">
          {docs.length === 0 ? (
            <p>No unpublished docs right now.</p>
          ) : (
            <ul className="dn-register">
              {docs.map((d) => (
                <li className="dn-register__row" key={d.slug}>
                  <Link to={`/backstage/${d.slug}`}>{d.title}</Link>
                </li>
              ))}
            </ul>
          )}
          <p>
            <Link to="/backstage/weekly">Weekly reports</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
