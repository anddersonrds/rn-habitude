import { accent, colors, success, tints } from "@/theme";
import { Color } from "expo-router";

describe("the iOS palette", () => {
  it("should fill every key from a system color", () => {
    expect(colors).toEqual({
      background: Color.ios.systemBackground,
      groupedBackground: Color.ios.systemGroupedBackground,
      secondaryBackground: Color.ios.secondarySystemGroupedBackground,
      text: Color.ios.label,
      secondaryText: Color.ios.secondaryLabel,
      tertiaryText: Color.ios.tertiaryLabel,
      mutedText: Color.ios.systemGray,
      fill: Color.ios.tertiarySystemFill,
      subtleFill: Color.ios.quaternarySystemFill,
      separator: Color.ios.separator,
      destructive: Color.ios.systemRed,
    });
  });

  it("should keep the tokens that are hex on purpose", () => {
    expect([accent, success]).toEqual(["#32ADE6", "#34C759"]);
    expect(tints.yellow).toBe("#FFCC00");
  });
});
