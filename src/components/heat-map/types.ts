import type { Habit } from "@/lib/types";

export type Props = {
  habit: Habit;
  completed: Record<string, true> | undefined;
  weeks?: number;
  cellSize?: number;
  gap?: number;
  /** Show month labels above and weekday labels on the left. */
  labels?: boolean;
  scrollable?: boolean;
};
