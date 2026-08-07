import { todayKey } from "@/lib/dates";
import { scheduleLabel } from "@/lib/habits";
import { haptic } from "@/lib/haptics";
import { deleteHabit, reorderHabits, useAppState } from "@/lib/store";
import { computeStreaks, trailingDayStates } from "@/lib/streaks";
import type { Habit } from "@/lib/types";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import type { HabitRowModel } from "./types";

/** Days of history shown in each row's inline heat strip. */
export const STRIP_DAYS = 21;

/**
 * View model for the habits list: the rows, the totals above them, and every
 * action the list can take, so the SwiftUI view stays a thin render layer.
 */
export function useHabitsModel() {
  const { t } = useTranslation(["habits", "common"]);
  const { t: tSchedule } = useTranslation("schedule");
  const state = useAppState();
  const [reordering, setReordering] = useState(false);
  const today = todayKey();

  const rows: HabitRowModel[] = state.habits.map((habit) => ({
    habit,
    states: trailingDayStates(habit, state.completions[habit.id], STRIP_DAYS, today),
    streak: computeStreaks(habit, state.completions[habit.id], today).current,
    schedule: scheduleLabel(habit, tSchedule),
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
      t("common:deleteHabitTitle", { name: habit.name }),
      t("common:deleteHabitBody"),
      [
        { text: t("common:cancel"), style: "cancel" },
        {
          text: t("common:delete"),
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
    countLabel: t("count", { count: state.habits.length }),
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
