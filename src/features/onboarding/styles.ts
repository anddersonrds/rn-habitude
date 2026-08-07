import { layout } from "@/theme/spacing";
import { Color } from "expo-router";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.ios.systemBackground,
  },
  header: {
    height: 24,
    paddingHorizontal: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerAction: {
    width: 24,
    alignItems: "center",
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
  },
  stepCount: {
    color: Color.ios.systemGray,
    fontVariant: ["tabular-nums"],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.heroPadding,
  },
  titleBlock: {
    alignItems: "center",
    paddingTop: 24,
  },
  titleText: {
    letterSpacing: -0.64,
    fontWeight: "700",
    textAlign: "center",
  },
  stepDescription: {
    textAlign: "center",
    marginTop: 12,
  },
  ctaLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaContent: {
    paddingHorizontal: layout.heroPadding,
    paddingTop: 18,
  },
  ctaGlass: {
    borderRadius: layout.ctaRadius,
  },
  cta: {
    minHeight: 58,
    borderRadius: layout.ctaRadius,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 22,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  skip: {
    alignItems: "center",
    paddingTop: 12,
  },
});
