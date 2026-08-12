import type { Habit } from "@/lib/domain/types";
import type { SharedValue } from "react-native-reanimated";

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

/**
 * The drag a SwiftUI `List` gives iOS for free. It belongs to the screen rather
 * than to a row: every row reads it to shift out of the way of the one being
 * dragged, and only the screen that declared the values may write them.
 */
export type Drag = {
  /** The row being dragged, or -1 when none is. */
  index: SharedValue<number>;
  /** How far that row has travelled, in pixels. */
  y: SharedValue<number>;
  start: (index: number) => void;
  move: (y: number) => void;
  end: () => void;
};

/** What the Android row needs on top of the props both platforms share. */
export type DragProps = {
  index: number;
  count: number;
  drag: Drag;
  onDrop: (from: number, to: number) => void;
};
