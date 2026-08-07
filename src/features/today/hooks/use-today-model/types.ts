import type { Habit } from "@/lib/types";

export type TodayItem = {
  habit: Habit;
  done: boolean;
  streak: number;
  /** "3-day streak · 7:30 AM", or null when there's nothing to show. */
  subtitle: string | null;
};
