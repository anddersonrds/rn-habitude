import type { Habit } from "@/lib/domain/types";

export type Props = {
  habit: Habit;
  states: number[];
  streak: number;
  schedule: string;
  neutral: string;
  /** The list is in reorder mode, which is what decides the row's shape. */
  reordering: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};
