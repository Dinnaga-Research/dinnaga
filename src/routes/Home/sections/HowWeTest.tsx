// ABOUTME: How we test, the homepage's closing section (#68): the approved copy and a link to /method whose
// ABOUTME: number is derived from the stage data, so it can never disagree with the page it links to.
import { Link } from 'react-router-dom';
import { METHOD_STAGES, type MethodStage } from '../../../data/method';
import { countWord } from '../../../lib/darkroom/marks';
import '../Home.css';

export function HowWeTest({ stages = METHOD_STAGES }: { stages?: MethodStage[] }) {
  return (
    <section className="dn-page" aria-labelledby="home-method-h">
      <div className="dn-section dn-grid home-method">
        <div className="dn-grid__label">
          <h2 id="home-method-h">How we test</h2>
        </div>
        <div className="dn-grid__body">
          <p className="home-method__body">
            We build every idea before we write about it, and most die in the trying. What survives ends up in the
            library, with a note on how we tested it.
          </p>
          <p className="home-section__more">
            <Link to="/method">{`See the ${countWord(stages.length)} stages →`}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
