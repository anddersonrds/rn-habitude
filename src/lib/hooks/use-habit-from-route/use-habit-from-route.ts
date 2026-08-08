import type { Habit } from "@/lib/domain/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

/** Sends the screen back once the habit is gone, and answers `undefined`. */
export function useHabitFromRoute(habits: Habit[]): Habit | undefined {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habit = habits.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (!habit && router.canGoBack()) router.back();
  }, [habit]);

  return habit;
}
