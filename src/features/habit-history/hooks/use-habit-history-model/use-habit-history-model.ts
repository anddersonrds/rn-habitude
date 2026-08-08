import { todayKey } from "@/lib/dates";
import { useHabitFromRoute } from "@/lib/hooks/use-habit-from-route";
import { useAppState } from "@/lib/store";
import { completionRate, computeStreaks } from "@/lib/domain/streaks";

/** Null once the habit is gone, which is also when it sends the screen back. */
export function useHabitHistoryModel() {
  const habits = useAppState((state) => state.habits);
  const completions = useAppState((state) => state.completions);
  const habit = useHabitFromRoute(habits);

  if (!habit) return null;

  const today = todayKey();
  const completed = completions[habit.id];

  return {
    habit,
    completed,
    streaks: computeStreaks(habit, completed, today),
    totalDone: Object.keys(completed ?? {}).length,
    yearRate: completionRate(habit, completed, 365, today),
  };
}
