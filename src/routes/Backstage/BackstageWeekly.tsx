// ABOUTME: The paused weekly archive (/backstage/weekly, #64 and #37): a dated run log, newest first,
// ABOUTME: each run linking its report at /backstage/weekly/:date. Moved here from /weekly.
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/PageHead';
import { WEEKLY_RUNS } from '../../data/weeklyRuns';
import { formatDateRange, formatPausedSince } from '../../lib/dateFormat';
import './Backstage.css';

export function BackstageWeekly() {
  const newest = WEEKLY_RUNS[0]?.date;
  return (
    <div className="backstage dn-page">
      <PageHead
        title="Weekly reports"
        lede="The lab ran a week-in-review pass over its own transcripts each Saturday. Each run links to its full report."
      />
      {newest && (
        <div className="backstage__status dn-grid">
          <p className="dn-grid__body">{`Paused since ${formatPausedSince(newest)}.`}</p>
        </div>
      )}
      <div className="dn-grid dn-section">
        <ul className="dn-grid__body dn-register">
          {WEEKLY_RUNS.map((r) => (
            <li className="dn-register__row" key={r.date}>
              <h2 className="dn-register__title">
                <Link to={`/backstage/weekly/${r.date}`}>
                  {`Week in review, ${formatDateRange(r.windowStart, r.date)}`}
                </Link>
              </h2>
              <p className="dn-register__summary">{r.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
