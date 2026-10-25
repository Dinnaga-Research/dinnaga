// ABOUTME: How We Work route (/method) — the project-planning loop, Read → Ship.
// ABOUTME: Links to the project-planning repo only when it is public.
import { METHOD_STAGES } from '../../data/method';
import { PROJECT_PLANNING_URL } from '../../data/links';

export function Method() {
  return (
    <section className="section" id="method" data-screen-label="How We Work">
      <header className="section-head">
        <span className="section-eye">How we work</span>
        <h1 className="section-title">From read to ship.</h1>
      </header>
      <p className="panel-body">
        Project Planning is the funnel. Ideas come in one end; what survives validation comes out the
        other as something we would actually stand behind.
      </p>
      <ol className="method-loop">
        {METHOD_STAGES.map((s, i) => (
          <li className="method-stage" key={s.name}>
            <span className="method-num">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="method-name">{s.name}</h3>
            <p className="method-detail">{s.detail}</p>
          </li>
        ))}
      </ol>
      {PROJECT_PLANNING_URL && (
        <p className="panel-body">
          <a href={PROJECT_PLANNING_URL}>See the project-planning repository →</a>
        </p>
      )}
    </section>
  );
}
