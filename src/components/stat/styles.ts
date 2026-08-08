import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  column: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  rowLabel: {
    flex: 1,
  },
  /* Digits of one width, so a number changing does not shift what is beside it. */
  value: {
    fontVariant: ["tabular-nums"],
  },
});
