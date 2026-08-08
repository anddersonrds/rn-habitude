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

export function emit(): void {
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
