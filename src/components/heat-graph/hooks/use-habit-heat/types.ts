import type { MonthLabel } from "@/components/heat-graph/types";
import type { HeatStatus } from "@/lib/domain/heat";

export type HabitHeat = {
  columns: HeatStatus[][];
  monthLabels: MonthLabel[];
  weekdayLabels: string[];
};
