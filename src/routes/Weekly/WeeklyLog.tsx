// ABOUTME: Weekly run-log route (/weekly) — the chronological log of Saturday
// ABOUTME: week-in-review runs, newest-first, each linking into the /weekly/:date viewer.
import { Link } from 'react-router-dom';
import { WEEKLY_RUNS } from '../../data/weeklyRuns';
import { formatDateRange, formatPausedSince } from '../../lib/dateFormat';

export function WeeklyLog() {
  const newestDate = WEEKLY_RUNS[0]?.date;

  return (
    <section className="section" id="weekly" data-screen-label="Weekly">
      <header className="section-head">
        <span className="section-eye">// WEEKLY</span>
        <h1 className="section-title">The Saturday run log.</h1>
      </header>
      <p className="panel-body">
        The lab ran a week-in-review pass over its own transcripts each Saturday. Each run links
        to its full report.
      </p>
      {newestDate && <p className="panel-body">Paused since {formatPausedSince(newestDate)}.</p>}
      <ul className="artifact-index">
        {WEEKLY_RUNS.map((r) => (
          <li className="artifact-entry" key={r.date}>
            <span className="artifact-project">{formatDateRange(r.windowStart, r.date)}</span>
            <h3 className="artifact-title">
              <Link to={`/weekly/${r.date}`}>Week in review — {r.date}</Link>
            </h3>
            <p className="artifact-oneliner">{r.summary}</p>
            <footer className="artifact-foot">
              <span className="artifact-date">run {r.date}</span>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}
