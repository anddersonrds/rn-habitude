import { appFontFamily } from "@/components/ui/text";
import { layout } from "@/constants/layout";
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
  progressDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  progressDot: {
    height: 7,
    borderRadius: 4,
  },
  stepCount: {
    color: Color.ios.systemGray,
    fontVariant: ["tabular-nums"],
  },
  stepLayer: {
    flex: 1,
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
    backgroundColor: Color.ios.secondarySystemGroupedBackground,
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
    color: Color.ios.label,
  },
  cardSubtitle: {
    fontFamily: appFontFamily,
    fontSize: 15,
    fontWeight: "600",
    color: Color.ios.secondaryLabel,
  },
  cardCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  heatGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
  },
  heatColumn: {
    flex: 1,
    gap: 5,
  },
  heatCell: {
    height: 18,
    borderRadius: 5,
    borderCurve: "continuous",
  },
  featureList: {
    gap: 4,
    paddingTop: 34,
  },
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
