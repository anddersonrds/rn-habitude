import { habitFormPresentation } from "@/features/habit-form/presentation";

describe("the habit form presentation", () => {
  it("should present the form as a sheet expanded to its full height", () => {
    expect(habitFormPresentation).toEqual({
      headerShown: true,
      presentation: "formSheet",
      sheetAllowedDetents: [1],
      sheetCornerRadius: 28,
    });
  });
});
