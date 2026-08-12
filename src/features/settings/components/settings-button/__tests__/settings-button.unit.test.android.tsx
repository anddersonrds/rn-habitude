import { SettingsButton } from "@/features/settings/components/settings-button";
import { clickCompose } from "@/test-utils/native-events";
import { nativeView, viewWithModifier } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { Host } from "@expo/ui/jetpack-compose";

function renderButton(onPress = jest.fn()) {
  return renderWithProviders(
    <Host>
      <SettingsButton
        label="Load sample data"
        systemImage="wand.and.stars"
        onPress={onPress}
      />
    </Host>,
  );
}

describe("SettingsButton", () => {
  it("should read like every other row in the list", async () => {
    const { container } = await renderButton();

    expect(nativeView(container, "text", "Load sample data")).toBeTruthy();
  });

  it("should call back when it is pressed", async () => {
    const onPress = jest.fn();
    const { container } = await renderButton(onPress);

    await clickCompose(viewWithModifier(container, "clickable"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
