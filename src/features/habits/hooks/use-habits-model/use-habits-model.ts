import { confirmDeleteHabit } from "@/lib/alerts";
import { todayKey } from "@/lib/dates";
import { scheduleLabel } from "@/lib/domain/habits";
import { haptic } from "@/lib/haptics";
import { routes } from "@/lib/utils/routes";
import { deleteHabit, reorderHabits, useAppState } from "@/lib/data/store";
import { computeStreaks, trailingDayStates } from "@/lib/domain/streaks";
import type { Habit } from "@/lib/domain/types";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { HabitRowModel } from "./types";

/** Days of history shown in each row's inline heat strip. */
export const STRIP_DAYS = 21;

/**
 * View model for the habits list: the rows, the totals above them, and every
 * action the list can take, so the SwiftUI view stays a thin render layer.
 */
export function useHabitsModel() {
  const { t } = useTranslation("habits");
  const { t: tCommon } = useTranslation("common");
  const { t: tSchedule } = useTranslation("schedule");
  const habits = useAppState((state) => state.habits);
  const completions = useAppState((state) => state.completions);
  const [reordering, setReordering] = useState(false);
  const today = todayKey();

  const rows: HabitRowModel[] = habits.map((habit) => ({
    habit,
    states: trailingDayStates(habit, completions[habit.id], STRIP_DAYS, today),
    streak: computeStreaks(habit, completions[habit.id], today).current,
    schedule: scheduleLabel(habit, tSchedule),
  }));

  const bestStreak = rows.reduce((best, row) => Math.max(best, row.streak), 0);
  const totalCheckIns = Object.values(completions).reduce(
    (total, days) => total + Object.keys(days).length,
    0,
  );

  const addHabit = () => {
    haptic.tap();
    router.push(routes.habitForm());
  };

  const openHabit = (habit: Habit) => router.push(routes.habitDetail(habit.id));

  const editHabit = (habit: Habit) => router.push(routes.habitForm(habit.id));

  const confirmDelete = (habit: Habit) => {
    haptic.warning();
    confirmDeleteHabit(habit.name, tCommon, () => deleteHabit(habit.id));
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
    const ids = habits.map((habit) => habit.id);
    const moving = from.map((index) => ids[index]);
    const remaining = ids.filter((_, index) => !from.includes(index));
    const destination = to - from.filter((index) => index < to).length;
    remaining.splice(destination, 0, ...moving);
    reorderHabits(remaining);
    haptic.rigid();
  };

  return {
    rows,
    hasHabits: habits.length > 0,
    /** One habit cannot be put in a different order than itself. */
    canReorder: habits.length > 1,
    countLabel: t("count", { count: habits.length }),
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
