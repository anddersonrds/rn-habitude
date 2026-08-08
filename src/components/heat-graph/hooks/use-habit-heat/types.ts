import type { MonthLabel } from "@/components/heat-graph/types";
import type { HeatStatus } from "@/lib/heat";

export type HabitHeat = {
  columns: HeatStatus[][];
  monthLabels: MonthLabel[];
  weekdayLabels: string[];
};
