// ABOUTME: The runtime entry (spec §8.1) is what ProcessSequence loads with a dynamic import: the live controller
// ABOUTME: and the timeline it needs, nothing React.
import { describe, expect, it } from 'vitest';
import * as runtime from './index';

describe('darkroom runtime entry', () => {
  it('exports the live controller and the timeline', () => {
    expect(typeof runtime.mountSequence).toBe('function');
    expect(runtime.MARKS).toHaveLength(5);
    expect(runtime.N_FRAMES).toBe(180);
  });
});
