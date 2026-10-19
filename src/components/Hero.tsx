// ABOUTME: Hero — 7/5 split: super-type headline + lede + CTAs, and the boot terminal.
// ABOUTME: The interactive terminal itself lives in Terminal.tsx.
import { useNavigate } from 'react-router-dom';
import { Terminal, type TerminalMedia } from './Terminal';

interface HeroProps {
  media?: TerminalMedia;
}

export function Hero({ media }: HeroProps) {
  const navigate = useNavigate();
  return (
    <section className="hero" id="top">
      <div>
        <span className="hero-eyebrow">// 01 · DINNAGA</span>
        <h1 className="hero-title">Validated, then shared.</h1>
        <p className="hero-lede">
          Dinnaga Research reads the papers, podcasts and vendor docs, tests what they claim, and
          publishes what holds up.
        </p>
        <div className="hero-ctas">
          <button className="btn btn-primary" onClick={() => navigate('/atisha')}>
            See the Atisha Initiative
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/method')}>
            How we work
          </button>
        </div>
      </div>
      <div className="hero-art">
        <Terminal media={media} />
      </div>
    </section>
  );
}
