import { todayKey } from "../dates";
import { db } from "../db";
import { cancelReminders, scheduleHabitReminders } from "../notifications";
import type { Habit, HabitInput } from "../types";
import { emit, getAppState } from "./state";

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Re-schedules a habit's reminders and persists the new notification ids. */
export async function refreshReminders(habit: Habit): Promise<void> {
  try {
    const ids = await scheduleHabitReminders(habit);
    // Scheduling is asynchronous. If the habit was deleted while the OS request
    // was in flight, immediately clean up the now-orphaned reminders.
    if (!getAppState().habits.some((candidate) => candidate.id === habit.id)) {
      await cancelReminders(ids);
      return;
    }
    db.runSync("UPDATE habits SET notification_ids = ? WHERE id = ?", [
      JSON.stringify(ids),
      habit.id,
    ]);
    emit();
  } catch (error) {
    console.warn("Failed to schedule reminders:", error);
  }
}

export function createHabit(input: HabitInput): Habit {
  const row = db.getFirstSync<{ max_sort_order: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM habits",
  );
  const habit: Habit = {
    id: newId(),
    ...input,
    createdAt: todayKey(),
    notificationIds: [],
  };
  db.runSync(
    `INSERT INTO habits (id, name, icon, color, weekdays, reminder_time, created_at, notification_ids, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?)`,
    [
      habit.id,
      habit.name,
      habit.icon,
      habit.color,
      JSON.stringify(habit.weekdays),
      habit.reminderTime,
      habit.createdAt,
      (row?.max_sort_order ?? -1) + 1,
    ],
  );
  emit();
  void refreshReminders(habit);
  return habit;
}

export function updateHabit(id: string, input: HabitInput): void {
  const existing = getAppState().habits.find((habit) => habit.id === id);
  if (!existing) return;
  db.runSync(
    "UPDATE habits SET name = ?, icon = ?, color = ?, weekdays = ?, reminder_time = ? WHERE id = ?",
    [
      input.name,
      input.icon,
      input.color,
      JSON.stringify(input.weekdays),
      input.reminderTime,
      id,
    ],
  );
  emit();
  void refreshReminders({ ...existing, ...input });
}

export function deleteHabit(id: string): void {
  const habit = getAppState().habits.find((candidate) => candidate.id === id);
  if (!habit) return;
  void cancelReminders(habit.notificationIds);
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM completions WHERE habit_id = ?", [id]);
    db.runSync("DELETE FROM habits WHERE id = ?", [id]);
  });
  emit();
}

/** Persists a new habit order. `orderedIds` must contain every habit id. */
export function reorderHabits(orderedIds: string[]): void {
  db.withTransactionSync(() => {
    orderedIds.forEach((id, index) => {
      db.runSync("UPDATE habits SET sort_order = ? WHERE id = ?", [index, id]);
    });
  });
  emit();
}
