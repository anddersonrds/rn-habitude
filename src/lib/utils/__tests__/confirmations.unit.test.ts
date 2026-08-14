import i18n from "@/i18n/i18next";
import { deleteHabitRequest } from "@/lib/utils/confirmations";

/* Fixed rather than active: the confirmation takes the language it answers in,
so each case says which one it means instead of inheriting one. */
const en = i18n.getFixedT("en", "common");
const ptBR = i18n.getFixedT("pt-BR", "common");

describe("deleteHabitRequest", () => {
  it("should name the habit it is about to delete", () => {
    const request = deleteHabitRequest("Read", en, jest.fn());

    expect(request.title).toBe('Delete "Read"?');
    expect(request.body).toBe(
      "This permanently deletes the habit and its history.",
    );
  });

  it("should offer cancelling and deleting, and mark deleting destructive", () => {
    const request = deleteHabitRequest("Read", en, jest.fn());

    expect(request).toMatchObject({
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
  });

  it("should delete only once the request is answered", () => {
    const onConfirm = jest.fn();

    const request = deleteHabitRequest("Read", en, onConfirm);
    expect(onConfirm).not.toHaveBeenCalled();

    request.onConfirm?.();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should ask in the language it was given rather than in English", () => {
    const request = deleteHabitRequest("Ler", ptBR, jest.fn());

    expect(request.title).toBe('Apagar "Ler"?');
    expect([request.cancelLabel, request.confirmLabel]).toEqual([
      "Cancelar",
      "Apagar",
    ]);
  });
});
