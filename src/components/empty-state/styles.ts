import { layout } from "@/constants/layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 48,
    gap: 8,
  },
  symbolSurface: {
    width: 76,
    height: 76,
    borderRadius: 24,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  centered: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  button: {
    minHeight: 50,
    marginTop: 16,
    paddingHorizontal: 24,
    justifyContent: "center",
    borderRadius: layout.ctaRadius,
    borderCurve: "continuous",
  },
});
