// ABOUTME: Tests for the ray-marched Cromulon head and the planet-and-stars scene module.
// ABOUTME: Checks the grid size and that every material shows up in the show-me pose.
import { describe, expect, it } from 'vitest';
import { Mat, renderHead } from './head3d';

describe('renderHead', () => {
  const cells = renderHead({ cols: 80, rows: 40, cellAspect: 1.67, mouth: 0.85, scene: 'scene' });

  it('returns cols x rows cells', () => {
    expect(cells).toHaveLength(3200);
  });

  it('contains eye, pupil, mouth and planet cells', () => {
    for (const mat of [Mat.Eye, Mat.Pupil, Mat.Mouth, Mat.Planet]) {
      expect(cells.some((c) => c.mat === mat)).toBe(true);
    }
  });

  it('draws no planet or stars when the scene is just the head', () => {
    const head = renderHead({ cols: 80, rows: 40, cellAspect: 1.67, mouth: 0.85, scene: 'head' });
    expect(head.some((c) => c.mat === Mat.Planet)).toBe(false);
    expect(head.some((c) => c.mat === Mat.Skin)).toBe(true);
  });
});
