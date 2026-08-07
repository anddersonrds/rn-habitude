import type { SFSymbol } from "expo-symbols";

export type Props = {
  symbol: SFSymbol;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Overrides the app accent, so a habit-scoped empty state can use its color. */
  tint?: string;
};
