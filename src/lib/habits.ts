import { WEEKDAY_NAMES } from "@/constants/habit-options";
import { isDaily, type Habit } from "@/lib/types";

/** "Every day", "Mon, Wed, Fri", or "No days" - a habit's schedule in words. */
export function scheduleLabel(habit: Habit): string {
  if (isDaily(habit)) return "Every day";
  if (habit.weekdays.length === 0) return "No days";
  return habit.weekdays.map((day) => WEEKDAY_NAMES[day].slice(0, 3)).join(", ");
}
