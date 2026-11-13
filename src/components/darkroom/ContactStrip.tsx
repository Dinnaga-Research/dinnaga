// ABOUTME: ContactStrip (spec §8.2): reduced motion's five stills of the run, one per stage at STILL_P, captioned
// ABOUTME: "Stage n · Name"; one row from 760 px, a scroll-snap strip below. The Ship still carries the stamp.
import type { MethodStage } from '../../data/method';
import { STILL_P, countWord } from '../../lib/darkroom/marks';
import { FrameStill } from './FrameStill';

export function ContactStrip({ stages }: { stages: MethodStage[] }) {
  const word = countWord(stages.length);
  const count = word[0]!.toUpperCase() + word.slice(1);
  const last = stages.length - 1;
  return (
    <div className="contact" role="region" tabIndex={0} aria-label={`${count} stills of the method sequence`}>
      <ol className="contact__row">
        {stages.map((s, i) => (
          <li key={s.name}>
            <figure className="contact__still">
              <FrameStill
                p={STILL_P[i] ?? (i + 1) / stages.length}
                index={i}
                label={`Still frame for stage ${i + 1}, ${s.name}`}
                aspect="auto"
                stamp={i === last}
              />
              <figcaption className="dn-label">{`Stage ${i + 1} · ${s.name}`}</figcaption>
            </figure>
          </li>
        ))}
      </ol>
    </div>
  );
}
