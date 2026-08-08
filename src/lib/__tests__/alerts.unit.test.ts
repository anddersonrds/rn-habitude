import i18n from "@/i18n/i18next";
import { alertNotificationsOff, confirmDeleteHabit } from "@/lib/alerts";
import { Alert, Linking } from "react-native";

type AlertButtons = { text: string; style?: string; onPress?: () => void }[];

/* Fixed rather than active: the confirmation takes the language it answers in,
so each case says which one it means instead of inheriting one. */
const en = i18n.getFixedT("en", "common");
const ptBR = i18n.getFixedT("pt-BR", "common");

const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
const openURL = jest
  .spyOn(Linking, "openURL")
  .mockImplementation(async () => true);

function shown(): { title: string; body: string; buttons: AlertButtons } {
  const [title, body, buttons] = alert.mock.calls[0];
  return {
    title: title as string,
    body: body as string,
    buttons: (buttons ?? []) as AlertButtons,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("confirmDeleteHabit", () => {
  it("should name the habit it is about to delete", () => {
    confirmDeleteHabit("Read", en, jest.fn());

    expect(shown().title).toBe('Delete "Read"?');
    expect(shown().body).toBe(
      "This permanently deletes the habit and its history.",
    );
  });

  it("should offer cancelling and deleting, and mark deleting destructive", () => {
    confirmDeleteHabit("Read", en, jest.fn());

    expect(shown().buttons).toMatchObject([
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive" },
    ]);
  });

  it("should delete only once the destructive button is pressed", () => {
    const onConfirm = jest.fn();

    confirmDeleteHabit("Read", en, onConfirm);
    expect(onConfirm).not.toHaveBeenCalled();

    shown().buttons[1].onPress?.();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should leave cancelling to do nothing at all", () => {
    const onConfirm = jest.fn();

    confirmDeleteHabit("Read", en, onConfirm);
    shown().buttons[0].onPress?.();

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("should ask in the language it was given rather than in English", () => {
    confirmDeleteHabit("Ler", ptBR, jest.fn());

    expect(shown().title).toBe('Apagar "Ler"?');
    expect(shown().buttons.map((button) => button.text)).toEqual([
      "Cancelar",
      "Apagar",
    ]);
  });
});

describe("alertNotificationsOff", () => {
  const copy = {
    title: "Notifications are off",
    body: "Allow notifications in iOS Settings to receive reminders.",
    dismiss: "Not Now",
    openSettings: "Open Settings",
  };

  it("should show the copy its caller brought", () => {
    alertNotificationsOff(copy);

    expect(shown().title).toBe(copy.title);
    expect(shown().body).toBe(copy.body);
    expect(shown().buttons).toMatchObject([
      { text: "Not Now", style: "cancel" },
      { text: "Open Settings" },
    ]);
  });

  it("should open the app's own iOS settings pane", () => {
    alertNotificationsOff(copy);
    shown().buttons[1].onPress?.();

    expect(openURL).toHaveBeenCalledWith("app-settings:");
  });

  it("should leave dismissing to do nothing at all", () => {
    alertNotificationsOff(copy);
    shown().buttons[0].onPress?.();

    expect(openURL).not.toHaveBeenCalled();
  });
});
