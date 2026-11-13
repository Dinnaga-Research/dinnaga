// ABOUTME: ProcessSequence (spec §8.2): the homepage run. With motion, a sticky stage whose frames scroll-scrub
// ABOUTME: (runtime loaded by dynamic import); with reduced motion, the hero and a contact strip of five stills.
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import type { MethodStage } from '../../data/method';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { SequenceHandle } from '../../lib/darkroom';
import { N_FRAMES, countWord, frameLabel } from '../../lib/darkroom/marks';
import { ChapterRail } from './ChapterRail';
import { ContactStrip } from './ContactStrip';
import { Stamp } from './Stamp';
import './darkroom.css';

export interface ProcessSequenceProps {
  stages: MethodStage[];
  /** The four kinds of source, shown over their columns while they are read. */
  sources: string[];
  /** The hero copy (the page's h1 and what follows it). */
  hero: ReactNode;
  /** Id of the element right after the run; the skip link moves focus there. */
  afterId: string;
  /** Receives the live runtime once mounted, and null when it goes (the dev harness reads stats from it). */
  onRuntime?: (handle: SequenceHandle | null) => void;
}

const loadRuntime = () => import('../../lib/darkroom');

const listWords = (xs: string[]) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

const figureText = (sources: string[]) =>
  `Figure: a frame sequence. Columns of grey type from ${listWords(sources.map((s) => s.toLowerCase()))} are read, digested, gathered into notes and tested. Most notes are struck out. What survives is set into one page and stamped tested.`;

// "Most die here." is set in paper against the detail's second text colour: contrast, not colour (§3.4).
function Detail({ text }: { text: string }) {
  const parts = text.split(/(Most die here\.)/);
  return (
    <p className="run__detail">
      {parts.map((part, i) =>
        part === 'Most die here.' ? (
          <span key={i} className="run__die">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export function ProcessSequence(props: ProcessSequenceProps) {
  const reduced = useReducedMotion();
  return reduced ? <StillRun {...props} /> : <LiveRun {...props} />;
}

function StillRun({ stages, hero }: ProcessSequenceProps) {
  return (
    <section className="run run--still">
      <div className="run__hero">{hero}</div>
      <ContactStrip stages={stages} />
    </section>
  );
}

function LiveRun({ stages, sources, hero, afterId, onRuntime }: ProcessSequenceProps) {
  const [current, setCurrent] = useState(-1);
  const runRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLCanvasElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<SVGSVGElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const handleRef = useRef<SequenceHandle | null>(null);
  const onRuntimeRef = useRef(onRuntime);

  useEffect(() => {
    onRuntimeRef.current = onRuntime;
  });

  useEffect(() => {
    let cancelled = false;
    loadRuntime().then((rt) => {
      const [run, stage, plate, art, overlay] = [runRef.current, stageRef.current, plateRef.current, artRef.current, overlayRef.current];
      if (cancelled || !run || !stage || !plate || !art || !overlay) return;
      handleRef.current = rt.mountSequence({
        run,
        stage,
        plate,
        art,
        labels: Array.from(overlay.querySelectorAll<HTMLElement>('.run__source')),
        stamp: stampRef.current,
        hero: heroRef.current,
        counter: counterRef.current,
        onStage: setCurrent,
      });
      onRuntimeRef.current?.(handleRef.current);
    });
    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
      onRuntimeRef.current?.(null);
    };
  }, []);

  const jump = useCallback((i: number) => handleRef.current?.jumpTo(i), []);

  const skip = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(afterId);
    if (!target) return;
    e.preventDefault();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    if (!target.style.scrollMarginTop) target.style.scrollMarginTop = 'var(--dn-nav-h)';
    target.scrollIntoView?.({ block: 'start' });
    target.focus({ preventScroll: true });
  };

  return (
    <section className="run run--live" ref={runRef}>
      <div className="stage" ref={stageRef}>
        <canvas className="plate" ref={plateRef} aria-hidden="true" />
        <div className="run__art" ref={artRef} aria-hidden="true" />
        <div className="run__overlay" ref={overlayRef} aria-hidden="true">
          {sources.map((s) => (
            <span key={s} className="run__source">
              {s}
            </span>
          ))}
          <Stamp ref={stampRef} />
        </div>
        <div className="run__hero" ref={heroRef}>
          {hero}
          <p className="run__cue" aria-hidden="true">
            Scroll to develop
          </p>
        </div>
        <p className="dn-visually-hidden">{figureText(sources)}</p>
        <a className="run__skip" href={`#${afterId}`} onClick={skip}>
          Skip the sequence
        </a>
        <ChapterRail stages={stages} current={current} onJump={jump} />
        <ol className="run__captions" aria-label={`The ${countWord(stages.length)} stages`}>
          {stages.map((s, i) => (
            <li key={s.name} className={i === current ? 'is-on' : undefined}>
              <p className="run__step">{`Stage ${i + 1} of ${stages.length}`}</p>
              <p className="run__stage-name">{s.name}</p>
              <Detail text={s.detail} />
            </li>
          ))}
        </ol>
        <p className="run__counter" ref={counterRef} aria-hidden="true">
          {frameLabel(0, N_FRAMES)}
        </p>
      </div>
    </section>
  );
}
