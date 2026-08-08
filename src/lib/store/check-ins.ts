import { weekdayOf } from "../dates";
import { db } from "../db";
import { isScheduledOn } from "../types";
import { emit, getAppState } from "./state";

/**
 * Toggles a completion. Returns true when the habit ends up completed.
 */
export function toggleCompletion(habitId: string, date: string): boolean {
  const wasDone = getAppState().completions[habitId]?.[date] === true;
  if (wasDone) {
    db.runSync("DELETE FROM completions WHERE habit_id = ? AND date = ?", [
      habitId,
      date,
    ]);
  } else {
    db.runSync(
      "INSERT OR IGNORE INTO completions (habit_id, date, completed_at) VALUES (?, ?, ?)",
      [habitId, date, new Date().toISOString()],
    );
  }
  emit();
  return !wasDone;
}

/**
 * Marks a habit complete for a date. Unlike `toggleCompletion` this is safe to
 * call repeatedly, so the notification "Check in" action can use it.
 */
export function completeHabit(habitId: string, date: string): void {
  const habit = getAppState().habits.find(
    (candidate) => candidate.id === habitId,
  );
  if (!habit) return;
  // A notification action can arrive after a schedule edit. Never let a stale
  // reminder create an off-schedule completion.
  if (date < habit.createdAt || !isScheduledOn(habit, weekdayOf(date))) return;
  db.runSync(
    "INSERT OR IGNORE INTO completions (habit_id, date, completed_at) VALUES (?, ?, ?)",
    [habitId, date, new Date().toISOString()],
  );
  emit();
}
