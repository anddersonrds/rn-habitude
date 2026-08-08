import type { SFSymbol } from "expo-symbols";

/**
 * A metric and what it counts, in the two arrangements the app shows one in:
 * a column that shares a row with its siblings, or a row of its own led by an
 * icon. The arrangement carries the type sizes with it.
 */
export type Props =
  | {
      layout?: "column";
      value: string;
      label: string;
    }
  | {
      layout: "row";
      value: string;
      label: string;
      symbol: SFSymbol;
      color: string;
    };
