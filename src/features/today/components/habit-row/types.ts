import type { TodayItem } from "../../hooks/use-today-model/types";

export type Props = {
  item: TodayItem;
  onToggle: () => void;
  onEdit: () => void;
  onHistory: () => void;
  onDelete: () => void;
};
