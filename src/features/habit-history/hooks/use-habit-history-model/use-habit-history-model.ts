import { todayKey } from "@/lib/dates";
import { useHabitFromRoute } from "@/lib/hooks/use-habit-from-route";
import { useAppState } from "@/lib/store";
import { completionRate, computeStreaks } from "@/lib/streaks";

/** Null once the habit is gone, which is also when it sends the screen back. */
export function useHabitHistoryModel() {
  const state = useAppState();
  const habit = useHabitFromRoute(state.habits);

  if (!habit) return null;

  const today = todayKey();
  const completed = state.completions[habit.id];

  return {
    habit,
    completed,
    streaks: computeStreaks(habit, completed, today),
    totalDone: Object.keys(completed ?? {}).length,
    yearRate: completionRate(habit, completed, 365, today),
  };
}
