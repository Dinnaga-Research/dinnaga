// ABOUTME: The 404 page (#70) for any unknown path; the site chrome stays around it.
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/PageHead';

export function NotFound() {
  return (
    <div className="not-found dn-page">
      <PageHead title="Page not found" />
      <div className="dn-grid">
        <p className="not-found__body dn-grid__body">
          There's nothing at this address. Try the <Link to="/">homepage</Link> or <Link to="/atisha">Atisha</Link>.
        </p>
      </div>
    </div>
  );
}
