import { Stat } from "@/features/habit-history/components/stat";
import { renderWithProviders } from "@/test-utils/render";

describe("Stat", () => {
  it("should show the value and what it counts", async () => {
    const { getByText } = await renderWithProviders(
      <Stat value="248" label="Check-ins" />,
    );

    expect(getByText("248")).toBeOnTheScreen();
    expect(getByText("Check-ins")).toBeOnTheScreen();
  });

  it("should draw the value exactly as it is given it", async () => {
    const { getByText } = await renderWithProviders(
      <Stat value="1.248" label="Check-ins" />,
    );

    expect(getByText("1.248")).toBeOnTheScreen();
  });
});
