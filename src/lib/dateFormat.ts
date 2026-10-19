/**
 * Format a date range from start to end dates.
 * Dates are in YYYY-MM-DD format.
 * Output format uses day-month-year with en-dashes and proper spacing.
 */

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

function parseDate(dateStr: string): ParsedDate {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10);
  const day = parseInt(parts[2]!, 10);
  return { year, month, day };
}

function formatDateDay(date: ParsedDate): string {
  return `${date.day}`;
}

function formatMonthYear(date: ParsedDate): string {
  return `${MONTH_ABBR[date.month - 1]} ${date.year}`;
}

export function formatDateRange(windowStart: string, date: string): string {
  const start = parseDate(windowStart);
  const end = parseDate(date);

  if (start.year === end.year) {
    if (start.month === end.month) {
      // Same month: "3–8 Aug 2026"
      return `${formatDateDay(start)}–${formatDateDay(end)} ${formatMonthYear(end)}`;
    } else {
      // Different months, same year: "31 Aug – 5 Sep 2026"
      return `${formatDateDay(start)} ${MONTH_ABBR[start.month - 1]} – ${formatDateDay(end)} ${formatMonthYear(end)}`;
    }
  } else {
    // Different years: "29 Dec 2026 – 2 Jan 2027"
    return `${formatDateDay(start)} ${MONTH_ABBR[start.month - 1]} ${start.year} – ${formatDateDay(end)} ${formatMonthYear(end)}`;
  }
}

export function formatPausedSince(date: string): string {
  const parsed = parseDate(date);
  return `${formatDateDay(parsed)} ${MONTH_ABBR[parsed.month - 1]} ${parsed.year}`;
}
