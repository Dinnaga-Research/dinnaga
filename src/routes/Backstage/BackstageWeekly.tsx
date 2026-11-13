// ABOUTME: The paused weekly archive (/backstage/weekly), newest first, each run linking its report.
// ABOUTME: Moved from /weekly by the Darkroom foundation; the #64 page replaces it.
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/PageHead';
import { WEEKLY_RUNS } from '../../data/weeklyRuns';
import { formatDateRange } from '../../lib/dateFormat';

export function BackstageWeekly() {
  return (
    <div className="dn-page">
      <PageHead title="Weekly reports" />
      <div className="dn-grid dn-section">
        <ul className="dn-grid__body dn-register">
          {WEEKLY_RUNS.map((r) => (
            <li className="dn-register__row" key={r.date}>
              <h2 className="dn-register__title">
                <Link to={`/backstage/weekly/${r.date}`}>Week in review, {formatDateRange(r.windowStart, r.date)}</Link>
              </h2>
              <p className="dn-register__summary">{r.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
