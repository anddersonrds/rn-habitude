import { colors, continuousCorner, layout } from "@/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: colors.groupedBackground,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.groupedBackground,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.groupedBackground,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: layout.bottomPadding,
  },
  screenTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  /* The empty branch sits outside the content that carries the edge padding. */
  emptyTitle: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: "600",
  },
  totalsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.secondaryBackground,
    borderRadius: layout.cardRadius,
    ...continuousCorner,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  totalsTrailing: {
    alignItems: "flex-end",
  },
  footer: {
    marginTop: 4,
    marginHorizontal: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
