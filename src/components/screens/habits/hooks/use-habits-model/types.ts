import type { Habit } from "@/lib/types";

export type HabitRowModel = {
  habit: Habit;
  /** One entry per day of the strip, oldest first. */
  states: number[];
  streak: number;
  /** "Every day", or the weekdays the habit runs on. */
  schedule: string;
};
