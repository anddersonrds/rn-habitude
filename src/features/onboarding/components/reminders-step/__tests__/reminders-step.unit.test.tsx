import { RemindersStep } from "@/features/onboarding/components/reminders-step";
import i18n from "@/i18n/i18next";
import en from "@/i18n/locales/en";
import { symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";

const onboarding = en.translations.onboarding;

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("RemindersStep", () => {
  it("should show what a reminder will look like", async () => {
    const { getByText } = await renderWithProviders(
      <RemindersStep allowed={false} />,
    );

    expect(getByText(onboarding.notificationHeader)).toBeOnTheScreen();
    expect(getByText(onboarding.notificationHabit)).toBeOnTheScreen();
    expect(getByText(onboarding.notificationBody)).toBeOnTheScreen();
  });

  it("should ring the bell while permission is still being asked for", async () => {
    const { container } = await renderWithProviders(
      <RemindersStep allowed={false} />,
    );

    const [bell] = symbolViews(container);
    expect(bell.props.name).toBe("bell.fill");
  });

  it("should swap the bell for a checkmark once notifications are allowed", async () => {
    const { container } = await renderWithProviders(
      <RemindersStep allowed />,
    );

    const [seal] = symbolViews(container);
    expect(seal.props.name).toBe("checkmark");
  });

  it("should say notifications are allowed only when they are", async () => {
    const off = await renderWithProviders(<RemindersStep allowed={false} />);
    const on = await renderWithProviders(<RemindersStep allowed />);

    expect(off.queryByText(onboarding.permissionAllowed)).toBeNull();
    expect(on.getByText(onboarding.permissionAllowed)).toBeOnTheScreen();
  });
});
