import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  heatGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
  },
  heatColumn: {
    flex: 1,
    gap: 5,
  },
  heatCell: {
    height: 18,
    borderRadius: 5,
    borderCurve: "continuous",
  },
});
