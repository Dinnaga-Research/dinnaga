// ABOUTME: Terminal — the interactive boot terminal shown in the home hero's art column.
// ABOUTME: Types its boot sequence, invites a question, and unlocks /artifacts on the passphrase.
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
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
}: TerminalProps) {
  const navigate = useNavigate();
  const { rendered, done } = useTyped(bootLines);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sent, setSent] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
        text: 'nothing was sent. this terminal only listens for one phrase.',
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


      <div className="terminal-screen">
        <div className="terminal-curvature" aria-hidden="true" />
        <div className="terminal-scanlines" aria-hidden="true" />
        <div className="terminal-flicker" aria-hidden="true" />

        <div className="terminal-body">
          {rendered.map((t, i) => (
            <div className="t-line" key={i}>
              {t || ' '}
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
              <input
                ref={inputRef}
                className="t-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ask a question"
                spellCheck={false}
                autoComplete="off"
                aria-label="Ask Dinnaga a question"
              />
              <span className="t-cursor" aria-hidden="true">
                ▮
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
