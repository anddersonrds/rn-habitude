import { useConfirm } from "@/components/ui/confirm-dialog";
import type { ConfirmRequest } from "@/lib/utils/confirmations";
import { pressComposeButton } from "@/test-utils/native-events";
import { composeButton, nativeView, nativeViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { colors } from "@/theme";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Pressable } from "react-native";
import type { TestInstance } from "test-renderer";

/* Rasterising a glyph is native work, and the source it returns is opaque. */
jest.mock("expo-symbols", () => ({
  unstable_getMaterialSymbolSourceAsync: jest.fn(async () => ({
    uri: "file:///symbol.png",
  })),
}));

const ASK = "ask";

function request(overrides: Partial<ConfirmRequest> = {}): ConfirmRequest {
  return {
    title: "Delete Walk outside?",
    body: "This cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    onConfirm: () => {},
    ...overrides,
  };
}

function Probe({ ask }: { ask: ConfirmRequest }) {
  const { confirm, dialog } = useConfirm();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ASK}
        onPress={() => confirm(ask)}
      />
      {dialog}
    </>
  );
}

async function render(overrides: Partial<ConfirmRequest> = {}) {
  return renderWithProviders(<Probe ask={request(overrides)} />);
}

async function ask(overrides: Partial<ConfirmRequest> = {}) {
  const rendered = await render(overrides);

  fireEvent.press(screen.getByLabelText(ASK));
  await waitFor(() => expect(nativeViews(rendered.container)).not.toEqual([]));

  return rendered;
}

/** Waits for the dialog to leave, which is what dismissing it does. */
async function waitForDismissal(container: TestInstance): Promise<void> {
  await waitFor(() => expect(nativeViews(container)).toEqual([]));
}

/** The dialog itself, which is the only view that can be dismissed. */
function dialogView(container: TestInstance): TestInstance {
  const match = nativeViews(container).find(
    (node) => typeof node.props.onDismissRequest === "function",
  );
  if (!match) throw new Error("Nothing in the tree is a dialog.");
  return match;
}

/* A Compose icon is an image, so what says one was drawn is its source. */
function iconViews(container: TestInstance): TestInstance[] {
  return nativeViews(container).filter((node) => node.props.source !== undefined);
}

describe("useConfirm", () => {
  it("should draw nothing until a confirmation is asked for", async () => {
    const { container } = await render();

    expect(nativeViews(container)).toEqual([]);
  });

  it("should ask its question with both answers", async () => {
    const { container } = await ask();

    expect(nativeView(container, "text", "Delete Walk outside?")).toBeTruthy();
    expect(nativeView(container, "text", "This cannot be undone.")).toBeTruthy();
    expect(composeButton(container, "Delete")).toBeTruthy();
    expect(composeButton(container, "Cancel")).toBeTruthy();
  });

  it("should run the action the confirming button carries", async () => {
    const onConfirm = jest.fn();
    const { container } = await ask({ onConfirm });

    await pressComposeButton(composeButton(container, "Delete"));
    await waitForDismissal(container);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should leave the action alone when it is cancelled", async () => {
    const onConfirm = jest.fn();
    const { container } = await ask({ onConfirm });

    await pressComposeButton(composeButton(container, "Cancel"));
    await waitForDismissal(container);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("should mark a destructive action with the error colour and an icon", async () => {
    const { container } = await ask({ destructive: true });

    expect(dialogView(container).props.colors).toMatchObject({
      iconContentColor: colors.destructive,
      titleContentColor: colors.destructive,
    });
    await waitFor(() => expect(iconViews(container)).toHaveLength(1));
  });

  it("should offer one answer when there is nothing to decide", async () => {
    const { container } = await ask({ cancelLabel: undefined, confirmLabel: "OK" });

    expect(composeButton(container, "OK")).toBeTruthy();
    expect(() => composeButton(container, "Cancel")).toThrow();
  });

  it("should leave a plain confirmation unmarked", async () => {
    const { container } = await ask();

    expect(dialogView(container).props.colors).toBeUndefined();
    expect(iconViews(container)).toEqual([]);
  });
});
