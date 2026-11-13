// ABOUTME: A weekly report (/backstage/weekly/:date) in the reader frame; unknown dates render the 404.
// ABOUTME: Moved from /weekly/:date by the Darkroom foundation.
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
