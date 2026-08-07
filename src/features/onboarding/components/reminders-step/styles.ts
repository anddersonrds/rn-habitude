import { Color } from "expo-router";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
    paddingTop: 28,
  },
  notificationArtwork: {
    borderRadius: 30,
    borderCurve: "continuous",
    padding: 22,
    alignItems: "center",
    gap: 18,
  },
  bellCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.16)",
  },
  notificationCard: {
    alignSelf: "stretch",
    gap: 4,
    padding: 16,
    borderRadius: 22,
    borderCurve: "continuous",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingBottom: 4,
  },
  miniAppIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  points: {
    gap: 12,
  },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pointCopy: {
    flexShrink: 1,
  },
  allowedBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Color.ios.tertiarySystemFill,
  },
});
