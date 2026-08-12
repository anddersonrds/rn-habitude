import type { SymbolViewProps } from "expo-symbols";

export type Props = Omit<SymbolViewProps, "name"> & {
  /** A string rather than `SFSymbol`: a habit's icon comes out of the database. */
  name: string;
};
