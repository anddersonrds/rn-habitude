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
    gap: 16,
  },
  card: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    gap: 2,
  },
  legend: {
    flexDirection: "row",
    gap: 16,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    paddingVertical: 16,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Color.ios.separator,
  },
});
