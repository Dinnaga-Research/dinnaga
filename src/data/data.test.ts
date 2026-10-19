// ABOUTME: Tests for all static content data files (practices, surfaceData, etc.).
// ABOUTME: Verifies shape, length, and category constraints for each data export.
import { describe, expect, it } from 'vitest';
import { PRACTICES } from './practices';
import { SURFACE_DATA } from './surfaceData';
import { TICKER_ITEMS } from './tickerItems';
import { BOOT_LINES } from './bootLines';
import { NAV_LINKS } from './navLinks';

describe('content data files', () => {
  it('ships three practices', () => {
    expect(PRACTICES).toHaveLength(3);
    expect(PRACTICES.map((p) => p.icon)).toEqual(['ethos', 'method', 'atisha']);
  });

  it('ships five surface-data rows', () => {
    expect(SURFACE_DATA).toHaveLength(5);
  });

  it('ships ticker items, boot lines, and nav links', () => {
    expect(TICKER_ITEMS.length).toBeGreaterThan(0);
    expect(BOOT_LINES.length).toBeGreaterThan(0);
    expect(NAV_LINKS.map((l) => l.to)).toEqual([
      '/atisha',
      '/method',
      '/colophon',
      '/weekly',
    ]);
  });

  it('ships exactly six ticker items', () => {
    expect(TICKER_ITEMS).toHaveLength(6);
  });
});
