import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  secondaryStat: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryStatLabel: {
    flex: 1,
  },
  statNumber: {
    fontVariant: ["tabular-nums"],
  },
});
