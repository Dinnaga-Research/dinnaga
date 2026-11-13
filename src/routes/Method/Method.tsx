// ABOUTME: How we test (/method, #71): the mission lede, then the five stages as a contact sheet (spec §8.3),
// ABOUTME: each a row of number and name, detail and its still of the run; the Ship still carries the stamp.
import { Link } from 'react-router-dom';
import { FrameStill } from '../../components/darkroom/FrameStill';
import { PageHead } from '../../components/PageHead';
import { LEDE } from '../../data/copy';
import { PROJECT_PLANNING_URL } from '../../data/links';
import { METHOD_STAGES, type MethodStage } from '../../data/method';
import { STILL_P, countWord } from '../../lib/darkroom/marks';
import '../../components/darkroom/darkroom.css';
import './Method.css';

// "Most die here." is set in paper against the detail's second text colour: contrast, not colour (spec §3.4).
function Detail({ text }: { text: string }) {
  return (
    <p className="method-stage__detail">
      {text.split(/(Most die here\.)/).map((part, i) =>
        part === 'Most die here.' ? (
          <span key={i} className="method-stage__die">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export function Method({ stages = METHOD_STAGES }: { stages?: MethodStage[] }) {
  const count = countWord(stages.length);
  const last = stages.length - 1;
  return (
    <div className="method dn-page">
      <PageHead title="How we test" lede={LEDE} />
      <div className="dn-grid">
        <p className="method__intro dn-grid__body">
          {`Every idea goes through the same ${count} stages. Most never reach the last one.`}
        </p>
      </div>
      <ol className="method__sheet" aria-label={`The ${count} stages`}>
        {stages.map((s, i) => (
          <li className="method-stage" key={s.name}>
            <div className="method-stage__text">
              <h2 className="method-stage__name">
                <span className="method-stage__n">{i + 1}</span> {s.name}
              </h2>
              <Detail text={s.detail} />
            </div>
            <FrameStill
              p={STILL_P[i] ?? (i + 1) / stages.length}
              index={i}
              label={`Still frame for stage ${i + 1}, ${s.name}`}
              aspect="auto"
              stamp={i === last}
            />
          </li>
        ))}
      </ol>
      <div className="dn-grid method__close">
        <div className="dn-grid__body dn-measure">
          <p>
            Published documents are in <Link to="/atisha">Atisha</Link>, and each one says how it was tested.
          </p>
          {PROJECT_PLANNING_URL && (
            <p className="method__more">
              <a href={PROJECT_PLANNING_URL}>See the project-planning repository →</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
