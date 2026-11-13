// ABOUTME: What we're building on the homepage (#69): the first 3 repositories and 3 gists from
// ABOUTME: api/living in /building's row format, then a link to /building. A failed or empty sub-list
// ABOUTME: is left out; the section renders nothing while loading or when both are out.
import { Link } from 'react-router-dom';
import { GistRow } from '../../../components/LivingRows/GistRow';
import { RepoRow } from '../../../components/LivingRows/RepoRow';
import { useLiving } from '../../../hooks/useLiving';
import type { LivingSource } from '../../../lib/living/contract';
import './HomeLiving.css';

const EXCERPT = 3;

const shown = <T,>(source: LivingSource<T>) => (source.ok ? source.items.slice(0, EXCERPT) : []);

export function HomeBuilding() {
  const living = useLiving();
  if (living.status !== 'ok') return null;
  const repos = shown(living.data.repos);
  const gists = shown(living.data.gists);
  if (repos.length === 0 && gists.length === 0) return null;

  return (
    <section className="dn-page" aria-labelledby="home-building-h">
      <div className="dn-section dn-grid home-living">
        <div className="dn-grid__label">
          <h2 id="home-building-h">What we're building</h2>
          <p className="home-living__intro">Recent repositories and gists, updated automatically.</p>
        </div>
        <div className="dn-grid__body">
          <div className="home-living__pair">
            {repos.length > 0 && (
              <div>
                <h3 id="home-building-repos" className="dn-label home-living__sub">
                  Repositories
                </h3>
                <ul className="dn-register living-rows" aria-labelledby="home-building-repos">
                  {repos.map((r) => (
                    <RepoRow key={r.url} repo={r} />
                  ))}
                </ul>
              </div>
            )}
            {gists.length > 0 && (
              <div>
                <h3 id="home-building-gists" className="dn-label home-living__sub">
                  Gists
                </h3>
                <ul className="dn-register living-rows" aria-labelledby="home-building-gists">
                  {gists.map((g) => (
                    <GistRow key={g.url} gist={g} />
                  ))}
                </ul>
              </div>
            )}
          </div>
          <p className="living-more">
            <Link to="/building">Everything we're building →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
