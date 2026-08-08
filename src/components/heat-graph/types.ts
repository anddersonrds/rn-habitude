import type { HeatStatus } from "@/lib/heat";

/** A month's name and the column it starts on. */
export type MonthLabel = { week: number; label: string };

/** How cells fade in: per column, and again per cell down the column. */
export type HeatEntering = {
  duration: number;
  columnDelay: number;
  cellDelay: number;
};

export type Props = {
  /** Columns of days, oldest week first; each column runs top to bottom. */
  columns: HeatStatus[][];
  /** The habit's own color, or the app's where there is no habit yet. */
  accent: string;
  /** Square cells of this side. Left out, the columns share the width instead. */
  cellSize?: number;
  /** How tall a cell is when the columns share the width. */
  cellHeight?: number;
  gap: number;
  /** Corner radius, a proportion of a square cell unless it is given. */
  radius?: number;
  /** Fades the cells in. Ignored under Reduce Motion. */
  entering?: HeatEntering;
  /** Month names above the columns. */
  monthLabels?: MonthLabel[];
  /** Weekday initials down the left, one per row. */
  weekdayLabels?: string[];
  scrollable?: boolean;
};
