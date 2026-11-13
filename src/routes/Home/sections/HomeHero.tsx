// ABOUTME: The homepage hero (#67, #69's founder link): the run (spec §8.2) with the hero copy in its stage, or the
// ABOUTME: copy and five stills under reduced motion. #after-sequence marks where the run ends; the skip link lands there.
import { Link } from 'react-router-dom';
import { ProcessSequence } from '../../../components/darkroom/ProcessSequence';
import { HEADLINE, LEDE } from '../../../data/copy';
import { METHOD_STAGES } from '../../../data/method';
import '../Home.css';

const SOURCES = ['Papers', 'Podcasts', 'Vendor docs', 'Releases'];
export const AFTER_SEQUENCE = 'after-sequence';

// The h1 holds one plain text node: the engine freezes its line breaks before it condenses.
const heroCopy = (
  <div className="home-hero">
    <h1>{HEADLINE}</h1>
    <p className="home-hero__lede">{LEDE}</p>
    <p className="home-hero__founder">
      Dinnaga Research is run by <Link to="/building">David Ryan</Link>.
    </p>
    <p className="home-hero__go">
      <Link to="/atisha">Browse the library →</Link>
    </p>
  </div>
);

export function HomeHero() {
  return (
    <>
      <ProcessSequence stages={METHOD_STAGES} sources={SOURCES} hero={heroCopy} afterId={AFTER_SEQUENCE} />
      <div id={AFTER_SEQUENCE} className="home-after-sequence" />
    </>
  );
}
