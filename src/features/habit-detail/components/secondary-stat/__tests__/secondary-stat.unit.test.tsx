import { SecondaryStat } from "@/features/habit-detail/components/secondary-stat";
import { symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";

const props = {
  symbol: "trophy.fill",
  color: "#FFCC00",
  value: "12",
  label: "Best streak",
} as const;

describe("SecondaryStat", () => {
  it("should show the value and what it counts", async () => {
    const { getByText } = await renderWithProviders(
      <SecondaryStat {...props} />,
    );

    expect(getByText("12")).toBeOnTheScreen();
    expect(getByText("Best streak")).toBeOnTheScreen();
  });

  it("should draw the value exactly as it is given it", async () => {
    const { getByText } = await renderWithProviders(
      <SecondaryStat {...props} value="83%" />,
    );

    expect(getByText("83%")).toBeOnTheScreen();
  });

  it("should draw the symbol in the colour it is given", async () => {
    const { container } = await renderWithProviders(
      <SecondaryStat {...props} />,
    );

    const [symbol] = symbolViews(container);
    expect(symbol.props.name).toBe("trophy.fill");
    expect(symbol.props.tintColor).toBe("#FFCC00");
  });
});
