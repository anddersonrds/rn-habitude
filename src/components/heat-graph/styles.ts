import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  monthRow: {
    position: "relative",
    height: 16,
  },
  weekdayColumn: {
    marginRight: 6,
  },
  grid: {
    flexDirection: "row",
  },
  sharedGrid: {
    justifyContent: "space-between",
  },
  sharedColumn: {
    flex: 1,
  },
  cell: {
    borderCurve: "continuous",
  },
});
