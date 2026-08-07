import { layout } from "@/theme/spacing";
import { Color } from "expo-router";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.ios.systemGroupedBackground,
  },
  content: {
    padding: layout.screenPadding,
    paddingBottom: layout.bottomPadding,
    gap: 20,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: layout.ctaRadius,
    borderCurve: "continuous",
  },
  restCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
  },
  restIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Color.ios.tertiarySystemFill,
  },
  restCopy: {
    flex: 1,
    gap: 2,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  featuredStat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 16,
    gap: 6,
  },
  featuredStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  metricEyebrow: {
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  featuredValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  statNumber: {
    fontVariant: ["tabular-nums"],
  },
  statsDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Color.ios.separator,
    marginVertical: 12,
  },
  secondaryStats: {
    flex: 1.15,
    justifyContent: "center",
    paddingVertical: 6,
  },
  secondaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Color.ios.separator,
    marginLeft: 38,
  },
  heatCard: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    padding: 16,
  },
  heatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heatTitle: {
    gap: 2,
  },
});
