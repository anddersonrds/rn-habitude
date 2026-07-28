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

export function formatTime(hhmm: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatFullDate(key: string): string {
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
