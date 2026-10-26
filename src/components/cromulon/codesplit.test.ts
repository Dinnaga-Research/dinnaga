// ABOUTME: Guards the Cromulon code split: the Terminal loads the renderer lazily, never statically.
// ABOUTME: The build emitting a separate CromulonArt chunk depends on this.
import { describe, expect, it } from 'vitest';
import src from '../Terminal.tsx?raw';

describe('Cromulon code split', () => {
  it('loads CromulonArt through a dynamic import', () => {
    expect(src).toMatch(/lazy\(\(\) => import\('\.\/cromulon\/CromulonArt'\)\)/);
  });

  it('has no static import of the renderer modules', () => {
    expect(src).not.toMatch(/^import .* from '\.\/cromulon\//m);
  });
});
