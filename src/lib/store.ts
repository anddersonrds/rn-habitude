import { useSyncExternalStore } from "react";
import { AppState as RNAppState } from "react-native";
import { todayKey, weekdayOf } from "./dates";
import { db, getSetting, setSetting } from "./db";
import {
  cancelAllReminders,
  cancelReminders,
  scheduleHabitReminders,
} from "./notifications";
import { seedSampleData } from "./sample-data";
import {
  isScheduledOn,
  type AppState,
  type CompletionMap,
  type Habit,
  type HabitInput,
} from "./types";
import { syncWidgetFromState } from "./widget-sync";

type HabitRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  weekdays: string;
  reminder_time: string | null;
  created_at: string;
  notification_ids: string;
};

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    weekdays: JSON.parse(row.weekdays),
    reminderTime: row.reminder_time,
    createdAt: row.created_at,
    notificationIds: JSON.parse(row.notification_ids),
  };
}

function loadState(): AppState {
  const habitRows = db.getAllSync<HabitRow>(
    "SELECT * FROM habits ORDER BY sort_order, created_at, name",
  );
  const completionRows = db.getAllSync<{ habit_id: string; date: string }>(
    "SELECT habit_id, date FROM completions",
  );
  const completions: CompletionMap = {};
  for (const row of completionRows) {
    (completions[row.habit_id] ??= {})[row.date] = true;
  }
  return {
    habits: habitRows.map(rowToHabit),
    completions,
    onboarded: getSetting("onboarded") === "1",
  };
}

let state: AppState = loadState();
const listeners = new Set<() => void>();

function emit(): void {
  state = loadState();
  for (const listener of listeners) listener();
  syncWidgetFromState(state);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAppState(): AppState {
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getAppState);
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Re-schedules a habit's reminders and persists the new notification ids. */
async function refreshReminders(habit: Habit): Promise<void> {
  try {
    const ids = await scheduleHabitReminders(habit);
    // Scheduling is asynchronous. If the habit was deleted while the OS request
    // was in flight, immediately clean up the now-orphaned reminders.
    if (!state.habits.some((candidate) => candidate.id === habit.id)) {
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
  const existing = state.habits.find((habit) => habit.id === id);
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
  const habit = state.habits.find((candidate) => candidate.id === id);
  if (!habit) return;
  void cancelReminders(habit.notificationIds);
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM completions WHERE habit_id = ?", [id]);
    db.runSync("DELETE FROM habits WHERE id = ?", [id]);
  });
  emit();
}

/**
 * Toggles a completion. Returns true when the habit ends up completed.
 */
export function toggleCompletion(habitId: string, date: string): boolean {
  const wasDone = state.completions[habitId]?.[date] === true;
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
  const habit = state.habits.find((candidate) => candidate.id === habitId);
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

/** Persists a new habit order. `orderedIds` must contain every habit id. */
export function reorderHabits(orderedIds: string[]): void {
  db.withTransactionSync(() => {
    orderedIds.forEach((id, index) => {
      db.runSync("UPDATE habits SET sort_order = ? WHERE id = ?", [index, id]);
    });
  });
  emit();
}

export function setOnboarded(): void {
  setSetting("onboarded", "1");
  emit();
}

/** Flips the onboarded flag off so the root layout shows the flow again. */
export function resetOnboarding(): void {
  setSetting("onboarded", "0");
  emit();
}

export async function deleteAllData(): Promise<void> {
  await cancelAllReminders();
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM completions");
    db.runSync("DELETE FROM habits");
  });
  emit();
}

export function loadSampleData(): void {
  const previousReminderIds = state.habits
    .filter((habit) => habit.id.startsWith("sample-"))
    .flatMap((habit) => habit.notificationIds);
  if (previousReminderIds.length > 0) {
    void cancelReminders(previousReminderIds);
  }
  const habitsWithReminders = seedSampleData();
  emit();
  for (const habit of habitsWithReminders) {
    void refreshReminders(habit);
  }
}

// Push the initial widget snapshot before any route renders.
emit();

// Re-emit on foreground so the widget's "today" stays fresh across midnight.
RNAppState.addEventListener("change", (status) => {
  if (status === "active") emit();
});
