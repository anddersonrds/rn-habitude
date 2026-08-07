import type { SFSymbol } from "expo-symbols";

export type Props = {
  symbol: SFSymbol;
  title: string;
  description: string;
  /** Its place in the list, which is what staggers the entrance. */
  index: number;
};
