import {
  addDays,
  formatMonthShort,
  parseKey,
  todayKey,
  weekdayOf,
} from "../utils/dates";
import { isScheduledOn, type Habit } from "./types";

export type Streaks = { current: number; best: number };

/**
 * Streaks count consecutive *scheduled* days completed. Unscheduled days
 * neither add to nor break a streak. An incomplete today doesn't break the
 * current streak yet, because the day isn't over.
 */
export function computeStreaks(
  habit: Habit,
  completed: Record<string, true> | undefined,
  today: string = todayKey(),
): Streaks {
  const done = completed ?? {};

  /* Sample data back-fills history earlier than `createdAt`, so the oldest
  completion can precede the habit. */
  let start = habit.createdAt;
  for (const key of Object.keys(done)) {
    if (key < start) start = key;
  }
  if (start > today) return { current: 0, best: 0 };

  let best = 0;
  let run = 0;
  let currentRunEndsToday = 0;

  for (let day = start; day <= today; day = addDays(day, 1)) {
    if (!isScheduledOn(habit, weekdayOf(day))) continue;
    if (done[day]) {
      run += 1;
      if (run > best) best = run;
    } else if (day === today) {
      break;
    } else {
      run = 0;
    }
    currentRunEndsToday = run;
  }

  return { current: currentRunEndsToday, best };
}

export type HeatCellStatus = "done" | "missed" | "unscheduled" | "empty";

export type HeatCell = {
  date: string;
  /** Column (week) index, 0 = oldest week. */
  week: number;
  /** Row index, 0 = the day the week starts on … 6 = the day it ends on. */
  weekday: number;
  status: HeatCellStatus;
};

/**
 * GitHub-style heat grid: `weeks` columns of 7 rows ending at `endDate`'s week.
 * Days before the habit existed or after today are "empty". `weekStart` is the
 * day the columns begin on, 0 for Sunday.
 */
export function heatCells(
  habit: Habit,
  completed: Record<string, true> | undefined,
  weeks: number,
  endDate: string = todayKey(),
  weekStart = 0,
): HeatCell[] {
  const done = completed ?? {};

  let firstTracked = habit.createdAt;
  for (const key of Object.keys(done)) {
    if (key < firstTracked) firstTracked = key;
  }

  /* The last column is the week holding `endDate`, so the grid runs to that
  week's last day rather than to `endDate`. */
  const dayInWeek = (weekdayOf(endDate) - weekStart + 7) % 7;
  const gridEnd = addDays(endDate, 6 - dayInWeek);
  const gridStart = addDays(gridEnd, -(weeks * 7 - 1));

  const cells: HeatCell[] = [];
  let day = gridStart;
  for (let i = 0; i < weeks * 7; i++) {
    let status: HeatCellStatus;
    if (day > endDate || day < firstTracked) {
      status = "empty";
    } else if (done[day]) {
      status = "done";
    } else if (isScheduledOn(habit, weekdayOf(day))) {
      status = "missed";
    } else {
      status = "unscheduled";
    }
    cells.push({ date: day, week: Math.floor(i / 7), weekday: i % 7, status });
    day = addDays(day, 1);
  }
  return cells;
}

/** Month labels for heat grid columns: [{ week, label }] at month starts. */
export function heatMonthLabels(
  cells: HeatCell[],
  language: string,
): { week: number; label: string }[] {
  const labels: { week: number; label: string }[] = [];
  let lastMonth = -1;
  for (const cell of cells) {
    if (cell.weekday !== 0) continue;
    const month = parseKey(cell.date).getMonth();
    if (month !== lastMonth) {
      if (lastMonth !== -1 || cells[0].weekday === 0) {
        labels.push({
          week: cell.week,
          label: formatMonthShort(cell.date, language),
        });
      }
      lastMonth = month;
    }
  }
  /* Drop a first label that would collide with the second one. */
  if (labels.length >= 2 && labels[1].week - labels[0].week < 2) labels.shift();
  return labels;
}

/**
 * Compact day states for the trailing `days` window, oldest first. Shared by
 * the home screen widget and the native heat strip on the Habits screen:
 * 0 = not scheduled / before the habit existed, 1 = missed, 2 = done,
 * 3 = today and still pending.
 */
export function trailingDayStates(
  habit: Habit,
  completed: Record<string, true> | undefined,
  days: number,
  today: string = todayKey(),
): number[] {
  const done = completed ?? {};
  const states: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    if (done[day]) {
      states.push(2);
    } else if (day < habit.createdAt || !isScheduledOn(habit, weekdayOf(day))) {
      states.push(0);
    } else if (day === today) {
      states.push(3);
    } else {
      states.push(1);
    }
  }
  return states;
}

/** Completion rate over the trailing `days` window, scheduled days only. */
export function completionRate(
  habit: Habit,
  completed: Record<string, true> | undefined,
  days: number,
  today: string = todayKey(),
): number {
  const done = completed ?? {};

  let firstTracked = habit.createdAt;
  for (const key of Object.keys(done)) {
    if (key < firstTracked) firstTracked = key;
  }

  let scheduled = 0;
  let hit = 0;
  for (let i = 0; i < days; i++) {
    const day = addDays(today, -i);
    if (day < firstTracked) break;
    if (!isScheduledOn(habit, weekdayOf(day))) continue;
    scheduled += 1;
    if (done[day]) hit += 1;
  }
  return scheduled === 0 ? 0 : hit / scheduled;
}
