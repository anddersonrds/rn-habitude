import { todayKey } from "@/lib/dates";
import { scheduleLabel } from "@/lib/habits";
import { haptic } from "@/lib/haptics";
import { deleteHabit, reorderHabits, useAppState } from "@/lib/store";
import { computeStreaks, trailingDayStates } from "@/lib/streaks";
import type { Habit } from "@/lib/types";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

/** Days of history shown in each row's inline heat strip. */
export const STRIP_DAYS = 21;

export type HabitRowModel = {
  habit: Habit;
  /** One entry per day of the strip, oldest first. */
  states: number[];
  streak: number;
  /** "Every day", or the weekdays the habit runs on. */
  schedule: string;
};

/**
 * View model for the habits list: the rows, the totals above them, and every
 * action the list can take, so the SwiftUI view stays a thin render layer.
 */
export function useHabitsModel() {
  const state = useAppState();
  const [reordering, setReordering] = useState(false);
  const today = todayKey();

  const rows: HabitRowModel[] = state.habits.map((habit) => ({
    habit,
    states: trailingDayStates(habit, state.completions[habit.id], STRIP_DAYS, today),
    streak: computeStreaks(habit, state.completions[habit.id], today).current,
    schedule: scheduleLabel(habit),
  }));

  const bestStreak = rows.reduce((best, row) => Math.max(best, row.streak), 0);
  const totalCheckIns = Object.values(state.completions).reduce(
    (total, days) => total + Object.keys(days).length,
    0,
  );

  const addHabit = () => {
    haptic.tap();
    router.push("/habit-form");
  };

  const openHabit = (habit: Habit) => router.push(`/habit/${habit.id}`);

  const editHabit = (habit: Habit) => router.push(`/habit-form?id=${habit.id}`);

  const confirmDelete = (habit: Habit) => {
    haptic.warning();
    Alert.alert(
      `Delete "${habit.name}"?`,
      "This permanently deletes the habit and its history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHabit(habit.id),
        },
      ],
    );
  };

  const toggleReordering = () => {
    haptic.tap();
    setReordering((current) => !current);
  };

  /**
   * SwiftUI reports `destination` as an index in the pre-removal array, so the
   * moved ids are pulled out first and the target is shifted back by however
   * many of them sat before it.
   */
  const move = (from: number[], to: number) => {
    const ids = state.habits.map((habit) => habit.id);
    const moving = from.map((index) => ids[index]);
    const remaining = ids.filter((_, index) => !from.includes(index));
    const destination = to - from.filter((index) => index < to).length;
    remaining.splice(destination, 0, ...moving);
    reorderHabits(remaining);
    haptic.rigid();
  };

  return {
    rows,
    hasHabits: state.habits.length > 0,
    /** One habit cannot be put in a different order than itself. */
    canReorder: state.habits.length > 1,
    countLabel:
      state.habits.length === 1 ? "1 habit" : `${state.habits.length} habits`,
    bestStreak,
    totalCheckIns,
    reordering,
    toggleReordering,
    addHabit,
    openHabit,
    editHabit,
    confirmDelete,
    move,
  };
}
