// ABOUTME: Tests for the Terminal boot sequence generation.
import { describe, expect, it } from 'vitest';
import { getBootLines, BOOT_LINES } from './bootLines';

describe('getBootLines', () => {
  it('generates four boot lines for count 0 with singular "docs"', () => {
    const lines = getBootLines(0);
    expect(lines).toHaveLength(4);
    expect(lines[0]?.text).toBe('dinnaga research — behind the scenes');
    expect(lines[1]?.text).toBe('atisha: 0 public docs');
    expect(lines[2]?.text).toBe('everything else is backstage.');
    expect(lines[3]?.text).toBe('know the phrase? type it below.');
  });

  it('generates four boot lines for count 1 with singular "doc"', () => {
    const lines = getBootLines(1);
    expect(lines[1]?.text).toBe('atisha: 1 public doc');
  });

  it('generates four boot lines for count 3 with plural "docs"', () => {
    const lines = getBootLines(3);
    expect(lines[1]?.text).toBe('atisha: 3 public docs');
  });

  it('uses the real catalog length for the default BOOT_LINES export', () => {
    // Check that the exported BOOT_LINES uses the real catalog
    expect(BOOT_LINES).toHaveLength(4);
    // Line should mention atisha with the word "public docs"
    expect(BOOT_LINES[1]?.text).toMatch(/atisha:.*public doc/);
  });
});
