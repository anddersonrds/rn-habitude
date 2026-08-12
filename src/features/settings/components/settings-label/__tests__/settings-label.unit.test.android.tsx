import { SettingsLabel } from "@/features/settings/components/settings-label";
import { nativeView, nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { accent } from "@/theme";
import { Host } from "@expo/ui/jetpack-compose";
import type { TestInstance } from "test-renderer";

function renderLabel(props: { label?: string; value?: string } = {}) {
  const { label = "Notifications", value } = props;
  return renderWithProviders(
    <Host>
      <SettingsLabel label={label} systemImage="bell.fill" value={value} />
    </Host>,
  );
}

/** A rasterised symbol is an image, so the tint is all it can be found by. */
function icon(container: TestInstance): TestInstance {
  const found = nativeViews(container).find(
    (node) => node.props.source !== undefined,
  );
  if (!found) throw new Error("The row draws no icon.");
  return found;
}

describe("SettingsLabel", () => {
  it("should show the text it is given", async () => {
    const { container } = await renderLabel({
      label: "Send a test notification",
    });

    expect(
      nativeView(container, "text", "Send a test notification"),
    ).toBeTruthy();
  });

  it("should tint the icon with the app's accent", async () => {
    const { container } = await renderLabel();

    expect(icon(container).props.tint).toBe(accent);
  });

  it("should draw the value the row is given", async () => {
    const { container } = await renderLabel({ value: "12" });

    expect(nativeView(container, "text", "12")).toBeTruthy();
  });

  it("should draw nothing trailing when the row has no value", async () => {
    const { container } = await renderLabel();

    const texts = container
      .queryAll((node) => typeof node.props.text === "string")
      .map((node) => node.props.text);
    expect(texts).toEqual(["Notifications"]);
  });
});
