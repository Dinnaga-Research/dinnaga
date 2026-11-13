// ABOUTME: The frame-sequence runtime entry (spec §8.1), loaded by ProcessSequence with a dynamic import() so it
// ABOUTME: never ships in the entry chunk and reduced motion never loads it.
export { mountSequence } from './sequence';
export type { SequenceHandle, SequenceOptions, SequenceStats } from './sequence';
export { MARKS, N_FRAMES } from './marks';
