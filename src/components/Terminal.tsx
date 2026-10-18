// ABOUTME: Terminal — the interactive boot terminal shown in the home hero's art column.
// ABOUTME: Types its boot sequence, invites a question, and unlocks /artifacts on the passphrase.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
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
  // PROTOTYPE (branch prototype/cromulon): art layer drawn behind the text, under the scanlines.
  backdrop?: React.ReactNode;
}

interface HistoryEntry {
  kind: 'in' | 'out';
  text: string;
}

const UNLOCK_NAV_DELAY_MS = 900;

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

  return (
    <>
      {rendered.map((t, i) => (
        <div className="t-line" key={i}>
          {t || ' '}
        </div>
      ))}
    </>
  );
}

export function Terminal({
  media,
  bootLines = BOOT_LINES,
  unlockLines = UNLOCK_LINES,
  backdrop,
}: TerminalProps) {
  const navigate = useNavigate();
  const { rendered, done } = useTyped(bootLines);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sent, setSent] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // PROTOTYPE (branch prototype/cromulon): one block cursor — follows the boot typing, then the insertion point.
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [caret, setCaret] = useState(0);
  const [cursorX, setCursorX] = useState(0);
  useLayoutEffect(() => {
    const input = inputRef.current;
    setCursorX((mirrorRef.current?.offsetWidth ?? 0) - (input?.scrollLeft ?? 0));
  }, [caret, input]);
  const typingLine = Math.max(0, rendered.reduce((last, t, i) => (t ? i : last), 0));
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (done && inputRef.current && !sent) inputRef.current.focus();
  }, [done, sent]);

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
      setUnlocked(true);
      return;
    }
    setHistory((h) => [
      ...h,
      { kind: 'in', text: q },
      {
        kind: 'out',
        text: '▸ TRANSMISSION RECEIVED. NO OPERATOR ON THE LINE — WHAT WE VALIDATE SHIPS TO ATISHA.',
      },
    ]);
    setInput('');
    setSent(true);
  };

  return (
    <div className="terminal" aria-label="Dinnaga terminal">
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

      <div className="terminal-chrome">
        <span className="terminal-chrome-tag">SIGNAL // 042</span>
        <span className="terminal-chrome-meta">DINNAGA-OS · ENCRYPTED · 18:42Z</span>
        <span className="terminal-chrome-dots" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
        </span>
      </div>

      <div className="terminal-screen">
        <div className="terminal-curvature" aria-hidden="true" />
        <div className="terminal-scanlines" aria-hidden="true" />
        <div className="terminal-flicker" aria-hidden="true" />
        {backdrop}

        <div className="terminal-body">
          {rendered.map((t, i) => (
            <div className="t-line" key={i}>
              {t || ' '}
              {!done && i === typingLine && <span className="t-cursor-inline" aria-hidden="true" />}
            </div>
          ))}

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
                <input
                  ref={inputRef}
                  className="t-input"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setCaret(e.target.selectionStart ?? e.target.value.length);
                  }}
                  onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Ask Dinnaga a question"
                />
                {input === '' && (
                  <span className="t-ph" aria-hidden="true">
                    ask a question
                  </span>
                )}
                <span ref={mirrorRef} className="t-mirror" aria-hidden="true">
                  {input.slice(0, caret)}
                </span>
                <span className="t-cursor" aria-hidden="true" style={{ left: cursorX }} />
              </span>
            </form>
          )}

          {done && sent && (
            <div className="t-prompt is-done">
              <span className="t-caret">&gt;</span>
              <span style={{ color: 'var(--signal)' }}>
                NEW TRANSMISSION CLOSED. NO REPLY — WE PUBLISH, WE DO NOT CORRESPOND.
              </span>
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

      <div className="terminal-foot">
        <span>
          <span className="dot dot-live" /> UPLINK STABLE
        </span>
        <span>PING 42ms</span>
        <span>FIDELITY 87%</span>
        <span>OP · DINNAGA</span>
      </div>
    </div>
  );
}
