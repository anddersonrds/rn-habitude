import { todayKey } from "@/lib/dates";
import { useAppState } from "@/lib/store";
import { completionRate, computeStreaks } from "@/lib/streaks";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

/**
 * View model for the habit history screen. Returns null once the habit it was
 * showing is gone, which is also when it sends the screen back.
 */
export function useHabitHistoryModel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppState();
  const habit = state.habits.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (!habit && router.canGoBack()) router.back();
  }, [habit]);

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
