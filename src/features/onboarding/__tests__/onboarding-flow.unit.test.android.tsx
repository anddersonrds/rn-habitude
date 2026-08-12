import { OnboardingFlow } from "@/features/onboarding";
import i18n from "@/i18n/i18next";
import { renderWithProviders } from "@/test-utils/render";
import { colors, layout } from "@/theme";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

/* The flow is what is being rendered; where onboarding is recorded is not. */
jest.mock("@/lib/data/store", () => ({ setOnboarded: jest.fn() }));

jest.mock("@/lib/native/notifications", () => ({
  getNotificationPermission: jest.fn(async () => ({
    granted: false,
    canAskAgain: true,
    status: "undetermined",
    expires: "never",
  })),
  ensureNotificationPermission: jest.fn(async () => true),
}));

/* The surface behind the call to action, which the glass fills on iOS. */
function ctaSurface(container: TestInstance): TestInstance {
  const [found] = container.queryAll((node) => {
    const style = StyleSheet.flatten(node.props.style);
    return (
      style?.borderRadius === layout.ctaRadius &&
      style.backgroundColor !== undefined &&
      style.minHeight === undefined
    );
  });
  if (!found) throw new Error("The flow draws nothing behind its call to action.");
  return found;
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("onboarding without Liquid Glass", () => {
  it("should stand the call to action on a theme surface, since Android has no glass", async () => {
    const { container } = await renderWithProviders(<OnboardingFlow />);

    expect(
      StyleSheet.flatten(ctaSurface(container).props.style).backgroundColor,
    ).toBe(colors.secondaryBackground);
  });
});
