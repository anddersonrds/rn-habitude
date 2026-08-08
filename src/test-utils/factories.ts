import type { AppState, CompletionMap, Habit } from "@/lib/domain/types";

const EVERY_WEEKDAY = [0, 1, 2, 3, 4, 5, 6];

let sequence = 0;

export function makeHabit(overrides: Partial<Habit> = {}): Habit {
  sequence += 1;
  return {
    id: `habit-${sequence}`,
    name: `Habit ${sequence}`,
    icon: "star",
    color: "#32ADE6",
    weekdays: EVERY_WEEKDAY,
    reminderTime: null,
    createdAt: "2026-01-01",
    notificationIds: [],
    ...overrides,
  };
}

/** Builds the habit id to date key map the store keeps completions in. */
export function makeCompletions(
  byHabit: Record<string, string[]> = {},
): CompletionMap {
  const completions: CompletionMap = {};
  for (const [habitId, dates] of Object.entries(byHabit)) {
    completions[habitId] = {};
    for (const date of dates) completions[habitId][date] = true;
  }
  return completions;
}

export function makeAppState(overrides: Partial<AppState> = {}): AppState {
  return {
    habits: [],
    completions: {},
    onboarded: true,
    ...overrides,
  };
}
