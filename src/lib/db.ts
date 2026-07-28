import { openDatabaseSync } from "expo-sqlite";

export const db = openDatabaseSync("habitude.db");

const SCHEMA = `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    weekdays TEXT NOT NULL,
    reminder_time TEXT,
    created_at TEXT NOT NULL,
    notification_ids TEXT NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS completions (
    habit_id TEXT NOT NULL,
    date TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (habit_id, date)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`;

/** Idempotent schema setup, run once at startup. */
export function ensureSchema(): void {
  db.execSync(SCHEMA);
}

ensureSchema();

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}
