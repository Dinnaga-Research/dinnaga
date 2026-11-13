// ABOUTME: DEV-only harness route (/dev/frames) for the frame-sequence engine (spec §8.3): one live run, five stills,
// ABOUTME: and an <output> with the store's stats, median paint time and a rAF counter. Production never ships it.
import { useEffect, useRef, useState, type RefObject } from 'react';
import { FrameStill } from '../../components/darkroom/FrameStill';
import { ProcessSequence } from '../../components/darkroom/ProcessSequence';
import { METHOD_STAGES } from '../../data/method';
import type { SequenceHandle, SequenceStats } from '../../lib/darkroom';
import { STILL_P } from '../../lib/darkroom/marks';

const SOURCES = ['Papers', 'Podcasts', 'Vendor docs', 'Releases'];

// Counts rAF callbacks while the harness is mounted, so an idle page can be shown to do no work.
function useRafCounter() {
  const count = useRef(0);
  useEffect(() => {
    const original = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) =>
      original.call(window, (t) => {
        count.current++;
        cb(t);
      });
    return () => {
      window.requestAnimationFrame = original;
    };
  }, []);
  return count;
}

function StatsOutput({ handle, raf }: { handle: RefObject<SequenceHandle | null>; raf: RefObject<number> }) {
  const [snap, setSnap] = useState<{ stats: SequenceStats | null; raf: number }>({ stats: null, raf: 0 });
  useEffect(() => {
    const t = setInterval(() => setSnap({ stats: handle.current?.stats() ?? null, raf: raf.current }), 250);
    return () => clearInterval(t);
  }, [handle, raf]);
  const s = snap.stats;
  const mb = s ? (s.blobBytes / 1e6).toFixed(1) : '0';
  return (
    <output className="dn-label" data-stats={JSON.stringify({ ...s, raf: snap.raf })} style={{ display: 'block', whiteSpace: 'pre-wrap' }}>
      {s
        ? `${s.baked} / ${s.frames} baked, ${mb} MB of frames, ${s.decoded} decoded (peak ${s.peakDecoded}), ${s.stores} store\n` +
          `median paint ${s.paintMedianMs?.toFixed(2) ?? '-'} ms over ${s.paints}, first frame ${s.firstFrameMs?.toFixed(0) ?? '-'} ms, ` +
          `first and last baked ${s.firstLastMs?.toFixed(0) ?? '-'} ms, ${s.canvas.w}x${s.canvas.h} at ${s.scale.toFixed(2)}\n` +
          `rAF callbacks ${snap.raf}`
        : `No live run. rAF callbacks ${snap.raf}`}
    </output>
  );
}

export function DevFrames() {
  const handle = useRef<SequenceHandle | null>(null);
  const raf = useRafCounter();
  return (
    <div data-dev-frames="">
      <ProcessSequence
        stages={METHOD_STAGES}
        sources={SOURCES}
        afterId="after-sequence"
        hero={<h1>Dev harness</h1>}
        onRuntime={(h) => (handle.current = h)}
      />
      <div id="after-sequence" className="dn-page" style={{ paddingBlock: 'var(--dn-sp-10)' }}>
        <StatsOutput handle={handle} raf={raf} />
        <div className="dn-grid" style={{ marginTop: 'var(--dn-sp-9)', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
          {METHOD_STAGES.map((s, i) => (
            <figure key={s.name} data-still={i}>
              <FrameStill p={STILL_P[i]!} index={i} label={`Still frame for stage ${i + 1}, ${s.name}`} aspect="auto" stamp={i === 4} />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
