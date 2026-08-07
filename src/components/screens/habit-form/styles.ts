import { appFontFamily } from "@/components/ui/text";
import { layout } from "@/constants/layout";
import { Color } from "expo-router";
import { StyleSheet } from "react-native";

/** Swatch diameter in the color grid. */
export const COLOR_RING = 42;
/** Smallest acceptable gap; this is what decides how many fit per row. */
export const COLOR_GAP_MIN = 6;
/** Horizontal padding inside the color card. Shared by the style and the math. */
export const COLOR_CARD_PADDING = 12;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.bottomPadding,
  },
  nameCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  namePreviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 17,
    color: Color.ios.label,
    paddingVertical: 7,
  },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: "600",
  },
  card: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  schedulePicker: {
    gap: 9,
    paddingVertical: 14,
  },
  pickerHost: {
    height: 34,
  },
  conditionalBlock: {
    paddingBottom: 14,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Color.ios.separator,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 14,
  },
  weekdayDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  validationText: {
    color: Color.ios.systemRed,
    paddingTop: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  rowLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  iconCard: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    padding: 14,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  iconCell: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  colorCard: {
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    padding: COLOR_CARD_PADDING,
  },
  colorGrid: {
    gap: COLOR_GAP_MIN,
  },
  colorRow: {
    flexDirection: "row",
  },
  colorRing: {
    width: COLOR_RING,
    height: COLOR_RING,
    borderRadius: COLOR_RING / 2,
    borderWidth: 2.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    marginTop: 28,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: layout.cardRadius,
    borderCurve: "continuous",
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
  },
  keyboardAccessory: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    height: 48,
    justifyContent: "center",
  },
  keyboardAccessoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
});
