import type { SFSymbol } from "expo-symbols";

/* The arrangement carries the type sizes with it. */
export type Props =
  | {
      /** The number over its label, sharing the width with its siblings. */
      layout?: "column";
      value: string;
      label: string;
    }
  | {
      /** The label between an icon and the number. */
      layout: "row";
      value: string;
      label: string;
      symbol: SFSymbol;
      color: string;
    };
