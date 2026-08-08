import type { MonthLabel } from "@/components/heat-graph/types";
import type { HeatStatus } from "@/lib/heat";

/** A habit's history in the shape the grid draws it. */
export type HabitHeat = {
  columns: HeatStatus[][];
  monthLabels: MonthLabel[];
  weekdayLabels: string[];
};
