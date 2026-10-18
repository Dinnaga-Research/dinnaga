// ABOUTME: PROTOTYPE (throwaway) — the chosen homepage (register + Departure Mono terminal) with the
// ABOUTME: Cromulon behind the terminal text: ?variant= technique, plus opacity/motion/scene/mobile knobs.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PrototypeSwitcher } from '../../../../components/PrototypeSwitcher';
import { DirectionA } from '../directions';
import '../directions.css';
import { Halftone } from './Halftone';
import { LineArt } from './LineArt';
import { PlasmaHead, type Charset, type Motion } from './PlasmaHead';
import type { Scene } from './model';
import './cromulon.css';

const VARIANTS = [
  { key: 'P', label: 'Plasma ASCII · three-quarter 3D head' },
  { key: 'F', label: 'Plasma ASCII · converted show frame (local only)' },
  { key: 'A', label: 'Phosphor ghost · canvas dot halftone' },
  { key: 'B', label: 'Line art · strict ASCII' },
  { key: '0', label: 'No Cromulon (baseline)' },
];

export function CromulonPrototype() {
  const [params, setParams] = useSearchParams();
  const variant = params.get('variant') ?? 'P';
  const opacity = Number(params.get('opacity') ?? '0.3');
  const plasma = variant === 'P' || variant === 'F';
  const motion = params.get('motion') ?? (plasma ? 'settle' : 'static');
  const charset = (params.get('charset') ?? 'classic') as Charset;
  const scene = (params.get('scene') ?? 'scene') as Scene;
  const mobile = params.get('mobile') ?? 'tall';
  const set = (k: string, v: string) =>
    setParams((p) => {
      p.set(k, v);
      return p;
    }, { replace: true });

  const reactive = motion === 'reactive';
  const backdrop =
    plasma ? (
      <PlasmaHead key={`${variant}|${scene}|${charset}|${motion}`} source={variant === 'F' ? 'frame' : 'model'} scene={scene} opacity={opacity} charset={charset} motion={motion as Motion} />
    ) : variant === 'A' ? (
      <Halftone key={`${scene}|${reactive}`} scene={scene} opacity={opacity} reactive={reactive} />
    ) : variant === 'B' ? (
      <LineArt key={`${scene}|${reactive}`} scene={scene} opacity={opacity} reactive={reactive} />
    ) : null;

  const [rows, setRows] = useState(0);
  useEffect(() => {
    const measure = () => {
      const screen = document.querySelector('.crom .terminal-screen') as HTMLElement | null;
      const body = document.querySelector('.crom .terminal-body') as HTMLElement | null;
      if (screen && body) setRows(Math.floor((screen.clientHeight - 36) / parseFloat(getComputedStyle(body).lineHeight)));
    };
    const t = window.setTimeout(measure, 2500);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [mobile]);
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      <DirectionA className={`crom crom-mobile-${mobile}`} backdrop={backdrop} />
      <PrototypeSwitcher variants={VARIANTS}>
        <div className="proto-switcher-row proto-knobs">
          <label>
            Opacity
            <select value={String(opacity)} onChange={(e) => set('opacity', e.target.value)}>
              <option value="0.12">12% burn-in</option>
              <option value="0.2">20%</option>
              <option value="0.25">25%</option>
              <option value="0.3">30%</option>
            </select>
          </label>
          <label>
            Motion
            <select value={motion} onChange={(e) => set('motion', e.target.value)}>
              {plasma ? (
                <>
                  <option value="settle">flows 5 s, replays on hover/typing</option>
                  <option value="continuous">flows continuously</option>
                  <option value="static">static</option>
                </>
              ) : (
                <>
                  <option value="static">static</option>
                  <option value="reactive">mouth on keys, resolve on unlock</option>
                </>
              )}
            </select>
          </label>
          {plasma && (
            <label>
              Characters
              <select value={charset} onChange={(e) => set('charset', e.target.value)}>
                <option value="classic">classic  .:-=+*#%@</option>
                <option value="blocks">blocks ░▒▓█</option>
                <option value="dots">dots ·•●</option>
              </select>
            </label>
          )}
          <label>
            Scene
            <select value={scene} onChange={(e) => set('scene', e.target.value)}>
              <option value="scene">head + planet + stars</option>
              <option value="head">head only</option>
            </select>
          </label>
          <label>
            Phone layout
            <select value={mobile} onChange={(e) => set('mobile', e.target.value)}>
              <option value="tall">taller terminal (~14 rows)</option>
              <option value="short">16:10 lock, Cromulon peeks</option>
              <option value="hide">16:10 lock, no Cromulon on phones</option>
            </select>
          </label>
        </div>
        <pre className="proto-stats">
          {`terminal shows ~${rows} rows · reduced motion ${reduce ? 'ON: art is static' : 'off'} · unlock phrase: "show me what you got"`}
        </pre>
      </PrototypeSwitcher>
    </>
  );
}
