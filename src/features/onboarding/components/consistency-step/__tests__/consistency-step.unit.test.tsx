import { ConsistencyStep } from "@/features/onboarding/components/consistency-step";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import ptBR from "@/i18n/locales/pt-br";
import { symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";

const onboarding = en.translations.onboarding;

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("ConsistencyStep", () => {
  it("should name the three things the app does", async () => {
    const { getByText } = await renderWithProviders(<ConsistencyStep />);

    expect(getByText(onboarding.squareTitle)).toBeOnTheScreen();
    expect(getByText(onboarding.streakTitle)).toBeOnTheScreen();
    expect(getByText(onboarding.widgetTitle)).toBeOnTheScreen();
  });

  it("should describe each of them", async () => {
    const { getByText } = await renderWithProviders(<ConsistencyStep />);

    expect(getByText(onboarding.squareDescription)).toBeOnTheScreen();
    expect(getByText(onboarding.streakDescription)).toBeOnTheScreen();
    expect(getByText(onboarding.widgetDescription)).toBeOnTheScreen();
  });

  it("should give each row its own symbol, in order", async () => {
    const { container } = await renderWithProviders(<ConsistencyStep />);

    expect(symbolViews(container).map((symbol) => symbol.props.name)).toEqual([
      "square.grid.3x3.fill",
      "flame.fill",
      "rectangle.3.group.fill",
    ]);
  });

  it("should read in the language the app is set to", async () => {
    await i18n.changeLanguage("pt-BR");

    const { getByText } = await renderWithProviders(<ConsistencyStep />);

    expect(
      getByText(ptBR.translations.onboarding.streakTitle),
    ).toBeOnTheScreen();
  });
});
