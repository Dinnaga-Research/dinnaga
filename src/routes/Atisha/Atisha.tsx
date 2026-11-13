// ABOUTME: Atisha (/atisha): the public library. FOUNDATION STUB: the page head and a plain list of
// ABOUTME: the published docs; the register and the rest of #63's copy replace it.
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/PageHead';
import { publishedDocs } from '../../data/docs';

export function Atisha() {
  return (
    <div className="dn-page">
      <PageHead
        title="Atisha"
        lede="The public library. Every document here was tested before it was published, and says how."
      />
      <div className="dn-grid dn-section">
        <ul className="dn-grid__body dn-register">
          {publishedDocs().map((d) => (
            <li className="dn-register__row" key={d.slug}>
              <h2 className="dn-register__title">
                <Link to={`/atisha/${d.slug}`}>{d.title}</Link>
              </h2>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
