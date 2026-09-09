import { colors, continuousCorner, layout } from "@/theme";
import { StyleSheet } from "react-native";

/** Every row is this tall while reordering, which is what makes the drag exact. */
export const ROW_HEIGHT = 68;
export const ROW_GAP = 8;
/** How far one row travels to take the next one's place. */
export const ROW_PITCH = ROW_HEIGHT + ROW_GAP;

export const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: layout.cardRadius,
    ...continuousCorner,
    marginBottom: ROW_GAP,
  },
  content: {
    height: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    ...continuousCorner,
    alignItems: "center",
    justifyContent: "center",
  },
  labels: {
    flex: 1,
    gap: 3,
  },
  subtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  handle: {
    width: 40,
    height: ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
});
