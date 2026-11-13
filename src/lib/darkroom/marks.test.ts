// ABOUTME: C's timeline (spec §8.1): the five chapter marks, the still moments, 180 frames, the stage at p,
// ABOUTME: and the overlay and hero state per moment.
import { describe, expect, it } from 'vitest';
import {
  MARKS,
  N_FRAMES,
  STILL_P,
  frameAt,
  frameLabel,
  heroState,
  overlayState,
  railVisible,
  stageAt,
} from './marks';
import { buildScene } from './scene';
import { frameLayout } from './layout';

describe('timeline constants', () => {
  it('keeps C timings', () => {
    expect(MARKS).toEqual([0.06, 0.22, 0.4, 0.585, 0.78]);
    expect(STILL_P).toEqual([0.2, 0.34, 0.575, 0.7, 1]);
    expect(N_FRAMES).toBe(180);
  });
});

describe('stageAt', () => {
  it('is -1 before the first mark', () => {
    expect(stageAt(0)).toBe(-1);
    expect(stageAt(0.05)).toBe(-1);
  });

  it('is i at each mark and just before it (0.005 tolerance)', () => {
    MARKS.forEach((m, i) => {
      expect(stageAt(m)).toBe(i);
      expect(stageAt(m - 0.004)).toBe(i);
      expect(stageAt(m - 0.01)).toBe(i - 1);
    });
  });

  it('holds the last stage to the end', () => {
    expect(stageAt(1)).toBe(4);
  });
});

describe('frames', () => {
  it('maps p to the nearest frame index and a padded label', () => {
    expect(frameAt(0)).toBe(0);
    expect(frameAt(1)).toBe(179);
    expect(frameAt(0.5)).toBe(90);
    expect(frameLabel(0)).toBe('Frame 001 / 180');
    expect(frameLabel(41)).toBe('Frame 042 / 180');
    expect(frameLabel(179)).toBe('Frame 180 / 180');
  });
});

describe('overlay and hero state', () => {
  const scene = buildScene(frameLayout(1440, 856, 'wide', { left: 432, top: 42, right: 40, bottom: 64 }), 7193);

  it('source labels develop in, then go by 0.46', () => {
    expect(overlayState(scene, 0).lab).toBeCloseTo(0.3);
    expect(overlayState(scene, 0.2).lab).toBeCloseTo(1);
    expect(overlayState(scene, 0.46).lab).toBe(0);
  });

  it('the stamp lands between 0.905 and 0.95: scale 1.32 to 1', () => {
    expect(overlayState(scene, 0.9).stampA).toBe(0);
    expect(overlayState(scene, 0.9).stampS).toBeCloseTo(1.32);
    expect(overlayState(scene, 0.95).stampA).toBe(1);
    expect(overlayState(scene, 1).stampS).toBe(1);
  });

  it('reports the stamp box from the scene', () => {
    const o = overlayState(scene, 1);
    expect(o.stamp).toEqual(scene.stamp);
  });

  it('the hero condenses 125 to 62 over p 0 to 0.07 and fades from 0.012', () => {
    expect(heroState(0)).toEqual({ w: 125, alpha: 1, y: 0 });
    expect(heroState(0.07).w).toBeCloseTo(62);
    expect(heroState(0.01).alpha).toBe(1);
    expect(heroState(0.072).alpha).toBe(0);
    expect(heroState(0.072).y).toBeCloseTo(-18);
    expect(heroState(0.03).w).toBeLessThan(125);
  });

  it('the rail shows after p 0.035', () => {
    expect(railVisible(0.03)).toBe(false);
    expect(railVisible(0.04)).toBe(true);
  });
});
