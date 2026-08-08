import type { Habit } from "@/lib/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

/**
 * The habit the route points at, or `undefined` once it is gone - which is also
 * when it sends the screen back. Takes the habits rather than reading the store
 * itself, so the screen that already subscribes keeps being the only subscriber.
 */
export function useHabitFromRoute(habits: Habit[]): Habit | undefined {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habit = habits.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (!habit && router.canGoBack()) router.back();
  }, [habit]);

  return habit;
}
