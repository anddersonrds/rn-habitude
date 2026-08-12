import type { SymbolViewProps } from "expo-symbols";

export type Props = Omit<SymbolViewProps, "name"> & {
  /**
   * An SF Symbol name. A plain string rather than `SFSymbol`, because the value
   * a habit carries comes out of the database.
   */
  name: string;
};
