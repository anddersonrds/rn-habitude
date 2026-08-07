import { FeatureRow } from "@/features/onboarding/components/feature-row";
import { symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { accent } from "@/theme/colors";

const props = {
  symbol: "flame.fill",
  title: "Streaks",
  description: "See how long you have kept it up",
  index: 0,
} as const;

describe("FeatureRow", () => {
  it("should show the title and the description it is given", async () => {
    const { getByText } = await renderWithProviders(<FeatureRow {...props} />);

    expect(getByText(props.title)).toBeOnTheScreen();
    expect(getByText(props.description)).toBeOnTheScreen();
  });

  it("should draw the symbol it is given, tinted with the accent", async () => {
    const { container } = await renderWithProviders(<FeatureRow {...props} />);

    const [symbol] = symbolViews(container);
    expect(symbol.props.name).toBe("flame.fill");
    expect(symbol.props.tintColor).toBe(accent);
  });
});
