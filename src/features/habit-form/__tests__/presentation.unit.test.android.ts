import { habitFormPresentation } from "@/features/habit-form/presentation";

describe("the habit form presentation", () => {
  it("should show the header the screen builds its actions into", () => {
    expect(habitFormPresentation.headerShown).toBe(true);
  });

  it("should ask for no sheet, which is what discarded that header", () => {
    expect(habitFormPresentation.presentation).toBeUndefined();
    expect(habitFormPresentation.sheetAllowedDetents).toBeUndefined();
    expect(habitFormPresentation.sheetCornerRadius).toBeUndefined();
  });
});
