// ABOUTME: Behind the scenes (/backstage, #64): the docs not published to Atisha, then the paused
// ABOUTME: weekly archive. Unlisted: reached by URL only, with no link from the site.
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/PageHead';
import { unpublishedDocs } from '../../data/docs';
import { WEEKLY_RUNS } from '../../data/weeklyRuns';
import { formatPausedSince } from '../../lib/dateFormat';
import type { DocEntry, WeeklyRun } from '../../types';
import './Backstage.css';

interface BackstageProps {
  docs?: DocEntry[];
  runs?: WeeklyRun[];
}

/** `<n> reports, paused since <date>`, from the runs themselves: the count and the newest run's date. */
function weeklyLine(runs: WeeklyRun[]): string | null {
  const newest = runs.reduce<string | null>((max, r) => (max === null || r.date > max ? r.date : max), null);
  if (newest === null) return null;
  return `${runs.length} ${runs.length === 1 ? 'report' : 'reports'}, paused since ${formatPausedSince(newest)}`;
}

export function Backstage({ docs = unpublishedDocs(), runs = WEEKLY_RUNS }: BackstageProps) {
  const line = weeklyLine(runs);
  return (
    <div className="backstage dn-page">
      <PageHead
        title="Behind the scenes"
        lede="Docs we haven't published to Atisha, and the paused weekly archive. These pages are unlisted, and their files are public in the site's source."
      />
      <div className="dn-grid dn-section">
        <div className="dn-grid__body">
          {docs.length === 0 && <p className="backstage__none">No unpublished docs right now.</p>}
          <ul className="dn-register">
            {docs.map((d) => (
              <li className="dn-register__row" key={d.slug}>
                <p className="backstage__meta dn-label">{`${d.project} · ${formatPausedSince(d.published)}`}</p>
                <h2 className="dn-register__title">
                  <Link to={`/backstage/${d.slug}`}>{d.title}</Link>
                </h2>
                <p className="dn-register__summary">{d.summary}</p>
              </li>
            ))}
            <li className="dn-register__row">
              <h2 className="dn-register__title">
                <Link to="/backstage/weekly">Weekly reports</Link>
              </h2>
              {line && <p className="dn-register__summary">{line}</p>}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
