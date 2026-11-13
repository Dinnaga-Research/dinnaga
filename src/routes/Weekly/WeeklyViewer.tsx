// ABOUTME: Weekly report viewer route (/weekly/:date) — reader frame over the static
// ABOUTME: week-in-review report; unknown dates render NotFound.
import { useParams } from 'react-router-dom';
import { DocFrame } from '../../components/DocFrame';
import { weeklyRunByDate } from '../../data/weeklyRuns';
import { NotFound } from '../NotFound/NotFound';

export function WeeklyViewer() {
  const { date } = useParams();
  const run = date ? weeklyRunByDate(date) : undefined;
  if (!run) return <NotFound />;
  return (
    <DocFrame
      backHref="/weekly"
      backLabel="Weekly reports"
      kind="Weekly report"
      colophonTitle="Weekly report"
      dateLine={`Run ${run.date}, covering ${run.windowStart} to ${run.date}`}
      docPath={run.docPath}
    />
  );
}
