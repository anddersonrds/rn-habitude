import { SettingsButton } from "@/features/settings/components/settings-button";
import { pressButton } from "@/test-utils/native-events";
import { nativeView, nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { Host } from "@expo/ui/swift-ui";

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
  it("should read like every other row in the form", async () => {
    const { container } = await renderButton();

    expect(nativeView(container, "text", "Load sample data")).toBeTruthy();
    expect(
      container.queryAll((node) => node.props.systemName === "wand.and.stars"),
    ).toHaveLength(1);
  });

  it("should call back when it is pressed", async () => {
    const onPress = jest.fn();
    const { container } = await renderButton(onPress);

    const [button] = nativeViews(container).filter(
      (node) => typeof node.props.onButtonPress === "function",
    );
    await pressButton(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
