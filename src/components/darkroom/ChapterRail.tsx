// ABOUTME: ChapterRail (spec §7.6): the five method stages as real buttons on the run's timeline. The number is
// ABOUTME: derived from order and decorative; the current stage carries aria-current="step".
import type { CSSProperties } from 'react';
import type { MethodStage } from '../../data/method';
import { MARKS } from '../../lib/darkroom/marks';

interface Props {
  stages: MethodStage[];
  /** Index of the current stage, -1 before the first mark. */
  current: number;
  onJump: (index: number) => void;
}

export function ChapterRail({ stages, current, onJump }: Props) {
  return (
    <nav className="rail" aria-label="Jump to a method stage">
      <span className="rail__track" aria-hidden="true" />
      <span className="rail__fill" aria-hidden="true" />
      <ol>
        {stages.map((s, i) => (
          <li key={s.name} style={{ '--at': MARKS[i] ?? i / stages.length } as CSSProperties}>
            <button
              type="button"
              className={i === current ? 'is-on' : i < current ? 'is-past' : ''}
              aria-current={i === current ? 'step' : undefined}
              onClick={() => onJump(i)}
            >
              <span className="rail__tick" aria-hidden="true" />
              <span className="rail__n" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="rail__name">{s.name}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
