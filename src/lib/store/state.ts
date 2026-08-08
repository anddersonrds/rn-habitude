import { useSyncExternalStore } from "react";
import { AppState as RNAppState } from "react-native";
import { db, getSetting } from "../db";
import type { AppState, CompletionMap, Habit } from "../types";
import { syncWidgetFromState } from "../widget-sync";

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

function sameSequence<T>(next: T[], previous: T[]): boolean {
  return (
    next.length === previous.length &&
    next.every((value, index) => value === previous[index])
  );
}

function sameHabit(next: Habit, previous: Habit): boolean {
  return (
    next.id === previous.id &&
    next.name === previous.name &&
    next.icon === previous.icon &&
    next.color === previous.color &&
    next.reminderTime === previous.reminderTime &&
    next.createdAt === previous.createdAt &&
    sameSequence(next.weekdays, previous.weekdays) &&
    sameSequence(next.notificationIds, previous.notificationIds)
  );
}

function reuseHabits(next: Habit[], previous: Habit[]): Habit[] {
  const byId = new Map(previous.map((habit) => [habit.id, habit]));
  let identical = next.length === previous.length;
  const habits = next.map((habit, index) => {
    const before = byId.get(habit.id);
    if (!before || !sameHabit(habit, before)) {
      identical = false;
      return habit;
    }
    /* Same habits in a new order is a changed array of unchanged objects. */
    if (previous[index] !== before) identical = false;
    return before;
  });
  return identical ? previous : habits;
}

function reuseDates(
  next: Record<string, true>,
  previous: Record<string, true> | undefined,
): Record<string, true> {
  if (!previous) return next;
  const dates = Object.keys(next);
  const identical =
    dates.length === Object.keys(previous).length &&
    dates.every((date) => previous[date] === true);
  return identical ? previous : next;
}

function reuseCompletions(
  next: CompletionMap,
  previous: CompletionMap,
): CompletionMap {
  const completions: CompletionMap = {};
  let identical = Object.keys(next).length === Object.keys(previous).length;
  for (const [habitId, dates] of Object.entries(next)) {
    const reused = reuseDates(dates, previous[habitId]);
    if (reused !== previous[habitId]) identical = false;
    completions[habitId] = reused;
  }
  return identical ? previous : completions;
}

/*
Every reload rebuilds both tables from SQLite, so the objects are new even when
no row moved. `useSyncExternalStore` compares a slice with `Object.is`, so a
slice whose content is unchanged has to hand back the reference it already had.
*/
function loadState(previous: AppState | null): AppState {
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
  const habits = habitRows.map(rowToHabit);
  return {
    habits: previous ? reuseHabits(habits, previous.habits) : habits,
    completions: previous
      ? reuseCompletions(completions, previous.completions)
      : completions,
    onboarded: getSetting("onboarded") === "1",
  };
}

let state: AppState = loadState(null);
const listeners = new Set<() => void>();

export function emit(): void {
  state = loadState(state);
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

export function useAppState(): AppState;
export function useAppState<T>(selector: (state: AppState) => T): T;
/* Compared with `Object.is`, so a selector building an object inline loops. */
export function useAppState<T>(
  selector?: (state: AppState) => T,
): AppState | T {
  return useSyncExternalStore(subscribe, () =>
    selector ? selector(state) : state,
  );
}

/* Pushes the initial widget snapshot before any route renders. */
emit();

/* The widget's "today" would otherwise go stale across midnight. */
RNAppState.addEventListener("change", (status) => {
  if (status === "active") emit();
});
