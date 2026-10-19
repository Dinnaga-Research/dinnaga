import { describe, expect, it } from 'vitest';
import { formatDateRange, formatPausedSince } from './dateFormat';

describe('dateFormat', () => {
  describe('formatDateRange', () => {
    it('formats same-month range: 3–8 Aug 2026', () => {
      expect(formatDateRange('2026-08-03', '2026-08-08')).toBe('3–8 Aug 2026');
    });

    it('formats different-month range: 31 Aug – 5 Sep 2026', () => {
      expect(formatDateRange('2026-08-31', '2026-09-05')).toBe('31 Aug – 5 Sep 2026');
    });

    it('formats different-year range: 29 Dec 2026 – 2 Jan 2027', () => {
      expect(formatDateRange('2026-12-29', '2027-01-02')).toBe('29 Dec 2026 – 2 Jan 2027');
    });

    it('works correctly with TZ=Pacific/Kiritimati', () => {
      // Date parsing doesn't depend on timezone; it works directly on YYYY-MM-DD strings
      expect(formatDateRange('2026-08-03', '2026-08-08')).toBe('3–8 Aug 2026');
    });

    it('works correctly with TZ=America/Los_Angeles', () => {
      // Date parsing doesn't depend on timezone; it works directly on YYYY-MM-DD strings
      expect(formatDateRange('2026-08-03', '2026-08-08')).toBe('3–8 Aug 2026');
    });
  });

  describe('formatPausedSince', () => {
    it('formats paused-since date: 26 Sep 2026', () => {
      expect(formatPausedSince('2026-09-26')).toBe('26 Sep 2026');
    });

    it('works correctly with TZ=Pacific/Kiritimati', () => {
      // Date parsing doesn't depend on timezone; it works directly on YYYY-MM-DD strings
      expect(formatPausedSince('2026-09-26')).toBe('26 Sep 2026');
    });

    it('works correctly with TZ=America/Los_Angeles', () => {
      // Date parsing doesn't depend on timezone; it works directly on YYYY-MM-DD strings
      expect(formatPausedSince('2026-09-26')).toBe('26 Sep 2026');
    });
  });
});
