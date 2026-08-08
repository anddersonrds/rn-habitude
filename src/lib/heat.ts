import type { HeatCell } from "./streaks";

export type HeatStatus =
  | "done"
  | "pending"
  | "missed"
  | "unscheduled"
  | "empty";

export type HeatAppearance = { color: string; opacity: number };

/* Only the surfaces carry an opacity: the strip tints one neutral twice where
the grid reaches for two different system fills. */
export type HeatPalette = {
  accent: string;
  missed: HeatAppearance;
  unscheduled: HeatAppearance;
};

const PENDING_OPACITY = 0.3;

const INVISIBLE: HeatAppearance = { color: "transparent", opacity: 1 };

export function heatStatusOfCell(cell: HeatCell, today: string): HeatStatus {
  if (cell.status === "missed" && cell.date === today) return "pending";
  return cell.status;
}

/* The widget's Swift side reads these numbers, so the encoding is fixed. */
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
