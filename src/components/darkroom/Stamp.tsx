// ABOUTME: Stamp (spec §7.5): the red "Tested against" stamp, vector and aria-hidden. Ring text DINNAGA RESEARCH
// ABOUTME: · ATISHA, repeated and spread to close the circle; the blank rule is honest: the doc's tested line says what.
import { forwardRef, useCallback, useId, useLayoutEffect, useRef } from 'react';

const RING = 'DINNAGA RESEARCH · ATISHA · ';
const RING_R = 75;

/** Repeat the ring text as often as it fits, then spread it to close the circle exactly. */
function fitRing(svg: SVGSVGElement): void {
  const tp = svg.querySelector('textPath');
  const txt = svg.querySelector<SVGTextElement>('.stamp__ring');
  if (!tp || !txt || typeof txt.getComputedTextLength !== 'function') return;
  const circ = 2 * Math.PI * RING_R;
  txt.style.letterSpacing = '0px';
  tp.textContent = RING;
  const one = txt.getComputedTextLength();
  if (!(one > 0)) return;
  const n = Math.max(1, Math.floor(circ / one));
  tp.textContent = RING.repeat(n);
  const len = txt.getComputedTextLength();
  txt.style.letterSpacing = `${Math.max(0, (circ - len) / tp.textContent.length)}px`;
}

export const Stamp = forwardRef<SVGSVGElement, { className?: string }>(function Stamp({ className }, ref) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const ringId = `stamp-ring-${uid}`;
  const inkId = `stamp-ink-${uid}`;
  const own = useRef<SVGSVGElement | null>(null);
  const setRef = useCallback(
    (el: SVGSVGElement | null) => {
      own.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  useLayoutEffect(() => {
    let live = true;
    if (own.current) fitRing(own.current);
    document.fonts?.ready.then(() => {
      if (live && own.current) fitRing(own.current);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <svg
      ref={setRef}
      className={className ? `stamp ${className}` : 'stamp'}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id={ringId} d="M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0" />
        <filter id={inkId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves={2} seed={4} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={1.5} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves={3} seed={11} result="m" />
          <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.85" result="mm" />
          <feComposite in="d" in2="mm" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${inkId})`} fill="currentColor">
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="3.4" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <text className="stamp__ring">
          <textPath href={`#${ringId}`} startOffset="0">
            {RING.repeat(2)}
          </textPath>
        </text>
        <text className="stamp__big" x="100" y="99" textAnchor="middle">
          TESTED
        </text>
        <text className="stamp__small" x="102" y="121" textAnchor="middle">
          AGAINST
        </text>
        <rect x="76" y="133" width="48" height="1.6" />
      </g>
    </svg>
  );
});
