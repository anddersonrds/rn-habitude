import { SettingsLabel } from "@/features/settings/components/settings-label";
import { modifier, nativeView } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { accent, colors } from "@/theme/colors";
import { Host } from "@expo/ui/swift-ui";
import type { TestInstance } from "test-renderer";

function renderLabel(label = "Notifications") {
  return renderWithProviders(
    <Host>
      <SettingsLabel label={label} systemImage="bell.fill" />
    </Host>,
  );
}

function icon(container: TestInstance): TestInstance {
  const [found] = container.queryAll(
    (node) => typeof node.props.systemName === "string",
  );
  if (!found) throw new Error("The label draws no icon.");
  return found;
}

describe("SettingsLabel", () => {
  it("should show the text it is given", async () => {
    const { container } = await renderLabel("Send a test notification");

    expect(
      nativeView(container, "text", "Send a test notification"),
    ).toBeTruthy();
  });

  it("should draw the symbol it is given", async () => {
    const { container } = await renderLabel();

    expect(icon(container).props.systemName).toBe("bell.fill");
  });

  it("should tint the icon with the app's accent", async () => {
    const { container } = await renderLabel();

    expect(modifier(icon(container), "foregroundStyle").color).toBe(accent);
  });

  it("should leave the text in the ordinary label colour, not the accent", async () => {
    const { container } = await renderLabel();

    const text = nativeView(container, "text", "Notifications");
    expect(modifier(text, "foregroundStyle")).toMatchObject({
      color: colors.text,
    });
  });
});
