import { weekStartOf } from "@/i18n/i18next";
import { todayKey, weekdayInitials } from "@/lib/dates";
import { heatStatusOfCell, type HeatStatus } from "@/lib/heat";
import { heatCells, heatMonthLabels } from "@/lib/streaks";
import type { Habit } from "@/lib/types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { HabitHeat } from "./types";

/* Every other row is named, so seven initials never crowd the column. */
function weekdayRows(language: string, weekStart: number): string[] {
  const initials = weekdayInitials(language);
  return initials.map((_, row) =>
    row % 2 === 1 ? initials[(row + weekStart) % 7] : "",
  );
}

/**
 * A habit's history as the grid draws it, in the app's language: the columns
 * of days, the months above them and the weekday initials beside them.
 *
 * The habit is optional because a screen loses it the moment it is deleted,
 * and a hook cannot be the thing that stops being called. Without one there is
 * nothing to draw.
 */
export function useHabitHeat(
  habit: Habit | undefined,
  completed: Record<string, true> | undefined,
  weeks: number,
): HabitHeat {
  const { i18n } = useTranslation();
  const today = todayKey();
  const weekStart = weekStartOf(i18n.language);

  const cells = useMemo(
    () => (habit ? heatCells(habit, completed, weeks, today, weekStart) : []),
    [habit, completed, weeks, today, weekStart],
  );

  return useMemo(() => {
    const columns: HeatStatus[][] = [];
    for (const cell of cells) {
      (columns[cell.week] ??= []).push(heatStatusOfCell(cell, today));
    }
    return {
      columns,
      monthLabels: heatMonthLabels(cells, i18n.language),
      weekdayLabels: weekdayRows(i18n.language, weekStart),
    };
  }, [cells, today, i18n.language, weekStart]);
}
