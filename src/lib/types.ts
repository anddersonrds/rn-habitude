export type Habit = {
  id: string;
  name: string;
  /** SF Symbol name, picked from the predefined icon grid. */
  icon: string;
  /** Hex accent color, the only custom color in the app. */
  color: string;
  /** Scheduled weekdays, 0 = Sunday … 6 = Saturday. Length 7 means daily. */
  weekdays: number[];
  /** "HH:MM" 24h local time, or null for no reminder. */
  reminderTime: string | null;
  /** YYYY-MM-DD the habit started existing (the heat graph starts here). */
  createdAt: string;
  /** Scheduled local notification ids for this habit's reminders. */
  notificationIds: string[];
};

export type HabitInput = {
  name: string;
  icon: string;
  color: string;
  weekdays: number[];
  reminderTime: string | null;
};

/** habitId -> dateKey -> true */
export type CompletionMap = Record<string, Record<string, true>>;

export type AppState = {
  habits: Habit[];
  completions: CompletionMap;
  onboarded: boolean;
};

export function isScheduledOn(habit: Habit, weekday: number): boolean {
  return habit.weekdays.includes(weekday);
}

export function isDaily(habit: Pick<Habit, "weekdays">): boolean {
  return habit.weekdays.length === 7;
}
