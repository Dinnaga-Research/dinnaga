// ABOUTME: The Cromulon's shade ramp and plasma wobble: shade 0..1 becomes one of ten ASCII characters.
// ABOUTME: The plasma is our own sum of sines; it lightly modulates skin and planet shading over time.

export const RAMP = ' .:-=+*#%@';

/** Map a shade in 0..1 (clamped) to a ramp character. Pure and monotonic. */
export function rampChar(shade: number): string {
  const s = Math.max(0, Math.min(1, shade));
  return RAMP[Math.min(RAMP.length - 1, Math.round(s * (RAMP.length - 1)))]!;
}

/** Sum-of-sines plasma, -1..1. */
export function plasma(x: number, y: number, t: number): number {
  const v =
    Math.sin(x * 0.16 + t) +
    Math.sin(y * 0.21 - t * 1.3) +
    Math.sin((x + y) * 0.09 + t * 0.7) +
    Math.sin(Math.hypot(x - 40, y - 30) * 0.18 - t * 1.1);
  return v / 4;
}
