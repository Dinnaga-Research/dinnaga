// ABOUTME: How we test (/method): the five method stages, Read → Ship. FOUNDATION: the old copy on the
// ABOUTME: new primitives, so the route compiles and renders; #71's page replaces it.
import { PageHead } from '../../components/PageHead';
import { METHOD_STAGES } from '../../data/method';
import { PROJECT_PLANNING_URL } from '../../data/links';

export function Method() {
  return (
    <div className="dn-page">
      <PageHead title="How we test" />
      <div className="dn-grid dn-section">
        <div className="dn-grid__body">
          <ol className="dn-register">
            {METHOD_STAGES.map((s) => (
              <li className="dn-register__row" key={s.name}>
                <h2 className="dn-register__title">{s.name}</h2>
                <p className="dn-register__summary">{s.detail}</p>
              </li>
            ))}
          </ol>
          {PROJECT_PLANNING_URL && (
            <p className="dn-measure">
              <a href={PROJECT_PLANNING_URL}>See the project-planning repository →</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
