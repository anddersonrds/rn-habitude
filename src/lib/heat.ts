import type { HeatCell } from "./streaks";

/** What a day in a heat graph can be, whichever graph is drawing it. */
export type HeatStatus =
  | "done"
  | "pending"
  | "missed"
  | "unscheduled"
  | "empty";

export type HeatAppearance = { color: string; opacity: number };

/**
 * What a graph draws a day with. `accent` is the habit's own color; the other
 * two carry an opacity of their own because the SwiftUI strip tints one neutral
 * twice where a React Native grid reaches for two different system fills.
 */
export type HeatPalette = {
  accent: string;
  missed: HeatAppearance;
  unscheduled: HeatAppearance;
};

/** A day that is still open reads as a faded accent, not as a miss. */
const PENDING_OPACITY = 0.3;

const INVISIBLE: HeatAppearance = { color: "transparent", opacity: 1 };

/** A grid cell's status, telling today's unfinished day apart from a real miss. */
export function heatStatusOfCell(cell: HeatCell, today: string): HeatStatus {
  if (cell.status === "missed" && cell.date === today) return "pending";
  return cell.status;
}

/**
 * The compact encoding `trailingDayStates` answers in, named: 0 is a day the
 * habit was not scheduled on or did not exist for, 1 a miss, 2 a completion,
 * 3 today with the day not over.
 */
export function heatStatusOfDayState(state: number): HeatStatus {
  switch (state) {
    case 2:
      return "done";
    case 3:
      return "pending";
    case 1:
      return "missed";
    default:
      return "unscheduled";
  }
}

/** How a day is drawn: the one rule every heat graph in the app reads. */
export function heatAppearance(
  status: HeatStatus,
  palette: HeatPalette,
): HeatAppearance {
  switch (status) {
    case "done":
      return { color: palette.accent, opacity: 1 };
    case "pending":
      return { color: palette.accent, opacity: PENDING_OPACITY };
    case "missed":
      return palette.missed;
    case "unscheduled":
      return palette.unscheduled;
    case "empty":
      return INVISIBLE;
  }
}
