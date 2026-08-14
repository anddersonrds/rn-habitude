import { useConfirm } from "@/components/ui/confirm-dialog";
import type { ConfirmRequest } from "@/lib/utils/confirmations";
import { renderWithProviders } from "@/test-utils/render";
import { fireEvent, renderHook, screen } from "@testing-library/react-native";
import { Alert, Pressable } from "react-native";

type AlertButtons = { text: string; style?: string; onPress?: () => void }[];

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

async function ask(overrides: Partial<ConfirmRequest> = {}) {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  const rendered = await renderWithProviders(<Probe ask={request(overrides)} />);

  fireEvent.press(screen.getByLabelText(ASK));

  return { ...rendered, alert };
}

function buttonsOf(alert: jest.SpyInstance): AlertButtons {
  return alert.mock.calls[alert.mock.calls.length - 1][2] as AlertButtons;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useConfirm", () => {
  it("should ask its question through the system alert", async () => {
    const { alert } = await ask();

    expect(alert).toHaveBeenCalledWith(
      "Delete Walk outside?",
      "This cannot be undone.",
      expect.anything(),
    );
  });

  it("should offer the cancelling answer and then the confirming one", async () => {
    const { alert } = await ask();

    expect(buttonsOf(alert).map((button) => button.text)).toEqual([
      "Cancel",
      "Delete",
    ]);
  });

  it("should mark a destructive action with the platform's own style", async () => {
    const { alert } = await ask({ destructive: true });

    expect(buttonsOf(alert).map((button) => button.style)).toEqual([
      "cancel",
      "destructive",
    ]);
  });

  it("should leave a plain action unmarked", async () => {
    const { alert } = await ask();

    expect(buttonsOf(alert)[1].style).toBe("default");
  });

  it("should run the action the confirming answer carries", async () => {
    const onConfirm = jest.fn();
    const { alert } = await ask({ onConfirm });

    buttonsOf(alert)[1].onPress?.();

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should offer one answer when there is nothing to decide", async () => {
    const { alert } = await ask({ cancelLabel: undefined, confirmLabel: "OK" });

    expect(buttonsOf(alert).map((button) => button.text)).toEqual(["OK"]);
  });

  it("should return no element, so a call site reads the same on both platforms", async () => {
    const { result } = await renderHook(() => useConfirm());

    expect(result.current.dialog).toBeNull();
  });
});
