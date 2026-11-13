// ABOUTME: A weekly report (/backstage/weekly/:date, #64) in the reader frame, with the Weekly reports
// ABOUTME: back link; a date that is not a run renders the 404. Moved here from /weekly/:date.
import { useParams } from 'react-router-dom';
import { DocFrame } from '../../components/DocFrame';
import { weeklyRunByDate } from '../../data/weeklyRuns';
import { NotFound } from '../NotFound/NotFound';

export function BackstageWeeklyDoc() {
  const { date } = useParams();
  const run = date ? weeklyRunByDate(date) : undefined;
  if (!run) return <NotFound />;
  return (
    <DocFrame
      backHref="/backstage/weekly"
      backLabel="Weekly reports"
      kind="Weekly report"
      colophonTitle="Weekly report"
      dateLine={`Run ${run.date}, covering ${run.windowStart} to ${run.date}`}
      docPath={run.docPath}
    />
  );
}
