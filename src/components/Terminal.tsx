// ABOUTME: Terminal — the interactive boot terminal shown in the home hero's art column.
// ABOUTME: Types its boot sequence, invites a question, and unlocks /artifacts on the passphrase.
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTyped } from '../hooks/useTyped';
import { BOOT_LINES } from '../data/bootLines';
import { UNLOCK_LINES } from '../data/unlockLines';
import { isUnlockPhrase } from '../lib/unlock';
import type { BootLine } from '../types';

export interface TerminalMedia {
  type: 'video' | 'image';
  src: string;
  poster?: string;
  alt?: string;
}

interface TerminalProps {
  media?: TerminalMedia;
  bootLines?: BootLine[];
  unlockLines?: BootLine[];
}

interface HistoryEntry {
  kind: 'in' | 'out';
  text: string;
}

const CromulonArt = lazy(() => import('./cromulon/CromulonArt'));

const UNLOCK_NAV_DELAY_MS = 900;

// Renders typed lines with the single block cursor trailing the line being
// typed: the last non-empty line, or the first line before any character lands.
function TypedLines({ lines, showCursor }: { lines: string[]; showCursor: boolean }) {
  let active = 0;
  lines.forEach((t, i) => {
    if (t) active = i;
  });
  const cursor = <span className="t-cursor" aria-hidden="true" />;
  if (lines.length === 0) {
    return showCursor ? <div className="t-line">{cursor}</div> : null;
  }
  return (
    <>
      {lines.map((t, i) => (
        <div className="t-line" key={i}>
          {t || ' '}
          {showCursor && i === active && cursor}
        </div>
      ))}
    </>
  );
}

interface UnlockRevealProps {
  lines: BootLine[];
  onDone: () => void;
}

// Mounted once when the passphrase matches; `lines` must stay referentially
// stable for the lifetime of the mount (useTyped treats it as a mount-time input).
function UnlockReveal({ lines, onDone }: UnlockRevealProps) {
  const { rendered, done } = useTyped(lines);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onDone, UNLOCK_NAV_DELAY_MS);
    return () => clearTimeout(t);
  }, [done, onDone]);

  return <TypedLines lines={rendered} showCursor />;
}

export function Terminal({
  media,
  bootLines = BOOT_LINES,
  unlockLines = UNLOCK_LINES,
}: TerminalProps) {
  const navigate = useNavigate();
  const { rendered, done } = useTyped(bootLines);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sent, setSent] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [keystrokes, setKeystrokes] = useState(0);
  const [caret, setCaret] = useState(0);
  const [cursorX, setCursorX] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const navigatedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done && inputRef.current && !sent) inputRef.current.focus();
  }, [done, sent]);

  const syncCursor = useCallback(() => {
    setCursorX((mirrorRef.current?.offsetWidth ?? 0) - (inputRef.current?.scrollLeft ?? 0));
  }, []);

  useLayoutEffect(() => {
    syncCursor();
  }, [caret, input, syncCursor]);

  const trackCaret = (e: SyntheticEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    setCaret(el.selectionStart ?? el.value.length);
    syncCursor();
  };

  const goShelf = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    navigate('/artifacts');
  }, [navigate]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    if (isUnlockPhrase(q)) {
      setHistory((h) => [...h, { kind: 'in', text: q }]);
      setInput('');
      setCaret(0);
      setUnlocked(true);
      return;
    }
    setHistory((h) => [
      ...h,
      { kind: 'in', text: q },
      {
        kind: 'out',
        text: 'nothing was sent. this terminal only listens for one phrase.',
      },
    ]);
    setInput('');
    setCaret(0);
    setSent(true);
  };

  return (
    <div className="terminal" aria-label="Dinnaga terminal" ref={rootRef}>
      {media && media.type === 'video' && (
        <video
          className="terminal-media"
          src={media.src}
          poster={media.poster}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      {media && media.type === 'image' && (
        <img className="terminal-media" src={media.src} alt={media.alt ?? ''} />
      )}


      <div className="terminal-screen">
        <Suspense fallback={null}>
          <CromulonArt unlocked={unlocked} keystrokes={keystrokes} hoverRef={rootRef} />
        </Suspense>
        <div className="terminal-curvature" aria-hidden="true" />
        <div className="terminal-scanlines" aria-hidden="true" />
        <div className="terminal-flicker" aria-hidden="true" />

        <div className="terminal-body">
          <TypedLines lines={rendered} showCursor={!done} />

          {history.map((h, i) => (
            <div className={'t-line ' + (h.kind === 'in' ? 't-in' : 't-out')} key={'h' + i}>
              {h.kind === 'in' ? '> ' + h.text : h.text}
            </div>
          ))}

          {unlocked && <UnlockReveal lines={unlockLines} onDone={goShelf} />}

          {done && !sent && !unlocked && (
            <form className="t-prompt" onSubmit={onSubmit}>
              <span className="t-caret">&gt;</span>
              <span className="t-field">
                <span className="t-mirror" ref={mirrorRef} aria-hidden="true">
                  {input.slice(0, caret)}
                </span>
                <input
                  ref={inputRef}
                  className="t-input"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    trackCaret(e);
                  }}
                  onKeyDown={() => setKeystrokes((n) => n + 1)}
                  onSelect={trackCaret}
                  onKeyUp={trackCaret}
                  onClick={trackCaret}
                  onScroll={syncCursor}
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Ask Dinnaga a question"
                />
                {input === '' && (
                  <span className="t-placeholder" aria-hidden="true">
                    ask a question
                  </span>
                )}
                <span className="t-cursor" aria-hidden="true" style={{ left: cursorX }} />
              </span>
            </form>
          )}

          {done && sent && (
            <div className="t-prompt is-done">
              <span className="t-caret">&gt;</span>
              <button
                type="button"
                className="t-reset"
                onClick={() => {
                  setSent(false);
                  setHistory([]);
                }}
              >
                [RESET]
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
