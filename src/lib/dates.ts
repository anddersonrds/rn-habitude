/** Local-timezone date keys in YYYY-MM-DD format. All habit math is local. */

export function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** Parses a YYYY-MM-DD key to a Date at local midnight. */
export function parseKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: string, n: number): string {
  const date = parseKey(key);
  date.setDate(date.getDate() + n);
  return dateKey(date);
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(key: string): number {
  return parseKey(key).getDay();
}

/* The language is passed in rather than resolved here. Left undefined these
would follow the device, which is a different language from the app's whenever
the picker has been used, and this module imports nothing from `src/i18n/`. */

export function formatTime(hhmm: string, language: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(language, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatFullDate(key: string, language: string): string {
  return parseKey(key).toLocaleDateString(language, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatMonthShort(key: string, language: string): string {
  return parseKey(key).toLocaleDateString(language, { month: "short" });
}

/** 1 January 2023, a Sunday, so day 0 of a week is day 0 of this one. */
const REFERENCE_WEEK = new Date(2023, 0, 1);

/** The seven weekday initials, Sunday first. */
export function weekdayInitials(language: string): string[] {
  return Array.from({ length: 7 }, (_, day) => {
    const date = new Date(REFERENCE_WEEK);
    date.setDate(date.getDate() + day);
    return date.toLocaleDateString(language, { weekday: "narrow" });
  });
}
