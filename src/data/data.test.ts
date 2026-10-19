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

  it('ships three surface-data rows', () => {
    expect(SURFACE_DATA).toHaveLength(3);
    expect(SURFACE_DATA.map((r) => r.idx)).toEqual(['01', '02', '03']);
    expect(SURFACE_DATA.map((r) => r.label)).toEqual(['Mission', 'Method', 'Validation bar']);
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

  it('ships exactly four ticker items', () => {
    expect(TICKER_ITEMS).toHaveLength(4);
  });
});
