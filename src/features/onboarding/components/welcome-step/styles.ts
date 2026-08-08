import { appFontFamily, colors } from "@/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
    paddingTop: 28,
  },
  card: {
    borderRadius: 22,
    borderCurve: "continuous",
    padding: 16,
    gap: 20,
    backgroundColor: colors.secondaryBackground,
    boxShadow: "0 18px 44px rgba(0, 0, 0, 0.10)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: appFontFamily,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.text,
  },
  cardSubtitle: {
    fontFamily: appFontFamily,
    fontSize: 15,
    fontWeight: "600",
    color: colors.secondaryText,
  },
  cardCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
