import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 12,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
    gap: 2,
  },
  featureDescription: {
    lineHeight: 19,
  },
});
