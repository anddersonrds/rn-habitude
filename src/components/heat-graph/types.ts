import type { HeatStatus } from "@/lib/heat";

/** `week` is the column the month starts on. */
export type MonthLabel = { week: number; label: string };

/** The delays add up: per column, and again per cell down the column. */
export type HeatEntering = {
  duration: number;
  columnDelay: number;
  cellDelay: number;
};

export type Props = {
  /** Oldest week first; each column runs top to bottom. */
  columns: HeatStatus[][];
  accent: string;
  /** Square cells of this side. Left out, the columns share the width instead. */
  cellSize?: number;
  cellHeight?: number;
  gap: number;
  /** Defaults to a proportion of the cell size. */
  radius?: number;
  /** Ignored under Reduce Motion. */
  entering?: HeatEntering;
  monthLabels?: MonthLabel[];
  /** One per row, top to bottom. */
  weekdayLabels?: string[];
  scrollable?: boolean;
};
