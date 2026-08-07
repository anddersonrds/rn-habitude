import { colors } from "@/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  spark: {
    position: "absolute",
    borderRadius: 6,
  },
  ring: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    marginTop: 16,
  },
  textCard: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
    borderCurve: "continuous",
    backgroundColor: colors.secondaryBackground,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
});
