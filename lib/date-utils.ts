// Date helpers that avoid the "off by one day" timezone bug.
//
// A plain date like "2026-11-10" (no time) is parsed by `new Date()` as
// midnight UTC. In US time zones that is the evening of the PREVIOUS day,
// so it displays a day early. And `new Date().toISOString()` gives the UTC
// date, which is already "tomorrow" in the US evening. These helpers always
// use the user's local calendar day instead.

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

// Today's date as YYYY-MM-DD in the user's local time zone.
export function todayLocal(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Parse a YYYY-MM-DD string as a local date (not UTC). Other formats
// (full timestamps) are parsed normally.
export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) return value;
  const m = DATE_ONLY.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

// Format a date-only value the way toLocaleDateString() would, but on the
// correct calendar day.
export function formatDateOnly(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "";
  return parseDateOnly(value).toLocaleDateString(undefined, options);
}
