// ABOUTME: Guards the Cromulon code split: the Terminal loads the renderer lazily, never statically.
// ABOUTME: The build emitting a separate CromulonArt chunk depends on this.
import { describe, expect, it } from 'vitest';
import src from '../Terminal.tsx?raw';
import art from './CromulonArt.tsx?raw';
import frame from './frame.ts?raw';

describe('Cromulon code split', () => {
  it('loads CromulonArt through a dynamic import', () => {
    expect(src).toMatch(/lazy\(\(\) => import\('\.\/cromulon\/CromulonArt'\)\)/);
  });

  it('has no static import of the renderer modules', () => {
    expect(src).not.toMatch(/^import .* from '\.\/cromulon\//m);
  });
});

describe('Cromulon frame and SDF split', () => {
  it('loads the SDF head through a dynamic import in the renderer', () => {
    expect(art).toMatch(/import\('\.\/head3d'\)/);
    expect(art).not.toMatch(/^import .* from '\.\/head3d'/m);
  });

  it('reads the generated frame module only through import.meta.glob', () => {
    expect(frame).toMatch(/import\.meta\.glob/);
    expect(frame).not.toMatch(/from '\.\/cromulon-frame'/);
  });
});
