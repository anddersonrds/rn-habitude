import { Text } from "@/components/ui/text";
import { renderWithProviders } from "@/test-utils/render";
import { appFontFamily } from "@/theme/typography";
import { Color } from "expo-router";
import type { ReactElement } from "react";
import { StyleSheet } from "react-native";

const VARIANTS = [
  "largeTitle",
  "title",
  "title2",
  "title3",
  "headline",
  "body",
  "subheadline",
  "footnote",
  "caption",
] as const;

async function renderText(element: ReactElement, label: string) {
  const { getByText } = await renderWithProviders(element);
  return getByText(label);
}

/** Reads a style off the node the way the platform does: last value wins. */
async function styleOf(element: ReactElement, label: string) {
  const node = await renderText(element, label);
  return StyleSheet.flatten(node.props.style);
}

describe("Text", () => {
  it("should render what it is given", async () => {
    const node = await renderText(
      <Text>Every day counts</Text>,
      "Every day counts",
    );

    expect(node).toBeOnTheScreen();
  });

  it("should descend the type ramp from the large title to the caption", async () => {
    const sizes: Record<string, number | undefined> = {};

    for (const variant of VARIANTS) {
      const style = await styleOf(<Text variant={variant}>{variant}</Text>, variant);
      sizes[variant] = style.fontSize;
    }

    expect(sizes).toEqual({
      largeTitle: 34,
      title: 28,
      title2: 22,
      title3: 20,
      headline: 17,
      body: 17,
      subheadline: 15,
      footnote: 13,
      caption: 12,
    });
  });

  it("should weight the headline above the body it sits on", async () => {
    const headline = await styleOf(
      <Text variant="headline">Headline</Text>,
      "Headline",
    );
    const body = await styleOf(<Text>Body</Text>, "Body");

    expect([headline.fontWeight, body.fontWeight]).toEqual(["600", undefined]);
  });

  it("should fall back to the body variant", async () => {
    const style = await styleOf(<Text>No variant</Text>, "No variant");

    expect(style).toMatchObject({ fontSize: 17, letterSpacing: -0.41 });
  });

  it("should set the rounded font on every variant", async () => {
    for (const variant of VARIANTS) {
      const style = await styleOf(<Text variant={variant}>{variant}</Text>, variant);

      expect(style.fontFamily).toBe(appFontFamily);
    }
  });

  it("should use the primary label color by default", async () => {
    const style = await styleOf(<Text>Primary</Text>, "Primary");

    expect(style.color).toEqual(Color.ios.label);
  });

  it("should drop to the secondary label color when asked", async () => {
    const style = await styleOf(<Text secondary>Secondary</Text>, "Secondary");

    expect(style.color).toEqual(Color.ios.secondaryLabel);
  });

  it("should drop to the tertiary label color when asked", async () => {
    const style = await styleOf(<Text tertiary>Tertiary</Text>, "Tertiary");

    expect(style.color).toEqual(Color.ios.tertiaryLabel);
  });

  it("should take the tertiary label color when both are set", async () => {
    const style = await styleOf(
      <Text secondary tertiary>
        Both
      </Text>,
      "Both",
    );

    expect(style.color).toEqual(Color.ios.tertiaryLabel);
  });

  it("should let a caller override the variant", async () => {
    const style = await styleOf(
      <Text variant="caption" style={{ fontSize: 40, color: "#FF3B30" }}>
        Override
      </Text>,
      "Override",
    );

    expect(style).toMatchObject({ fontSize: 40, color: "#FF3B30" });
  });

  it("should pass the remaining text props through", async () => {
    const node = await renderText(
      <Text numberOfLines={2} accessibilityRole="header">
        Truncated
      </Text>,
      "Truncated",
    );

    expect(node.props).toMatchObject({
      numberOfLines: 2,
      accessibilityRole: "header",
    });
  });
});
