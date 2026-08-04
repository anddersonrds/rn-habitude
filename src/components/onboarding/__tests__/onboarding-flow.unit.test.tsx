import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { STEPS } from "@/components/onboarding/useOnboardingModel";
import { symbolViews } from "@/test-utils/native-views";
import { renderWithProviders } from "@/test-utils/render";
import { accent } from "@/theme/colors";
import { fireEvent } from "@testing-library/react-native";
import { Color } from "expo-router";
import { StyleSheet } from "react-native";
import type { TestInstance } from "test-renderer";

/*
Reduced motion decides what wraps the step, and it is a hook rather than a
prop. Reanimated is spread so the animated views stay real, and `__esModule`
has to be declared or its default export goes missing.
*/
jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return {
    __esModule: true,
    ...actual,
    useReducedMotion: jest.fn(() => false),
  };
});

/* The flow is what is being rendered; where onboarding is recorded is not. */
jest.mock("@/lib/store", () => ({ setOnboarded: jest.fn() }));

jest.mock("@/lib/notifications", () => ({
  getNotificationPermission: jest.fn(async () => UNDETERMINED),
  ensureNotificationPermission: jest.fn(async () => true),
}));

const UNDETERMINED = {
  granted: false,
  canAskAgain: true,
  status: "undetermined",
  expires: "never",
};
const ALLOWED = { ...UNDETERMINED, granted: true, status: "granted" };

const { useReducedMotion } = jest.requireMock<{ useReducedMotion: jest.Mock }>(
  "react-native-reanimated",
);
const { setOnboarded } = jest.requireMock<{ setOnboarded: jest.Mock }>(
  "@/lib/store",
);
const notifications = jest.requireMock<{
  getNotificationPermission: jest.Mock;
  ensureNotificationPermission: jest.Mock;
}>("@/lib/notifications");

const DOT_HEIGHT = 7;
const CURRENT_DOT_WIDTH = 24;

/* The animated wrapper the flow fades the outgoing step out with. */
function transitionViews(container: TestInstance): TestInstance[] {
  return container.queryAll((node) => node.type === "EaseView");
}

/* Dots carry no text; their shared height is what marks them out. */
function dots(container: TestInstance) {
  return container
    .queryAll(
      (node) => StyleSheet.flatten(node.props.style)?.height === DOT_HEIGHT,
    )
    .map((dot) => {
      const style = StyleSheet.flatten(dot.props.style);
      return { width: style.width, filled: style.backgroundColor === accent };
    });
}

const [WELCOME, CONSISTENCY, REMINDERS] = STEPS;

beforeEach(() => {
  jest.clearAllMocks();
  useReducedMotion.mockReturnValue(false);
  notifications.getNotificationPermission.mockResolvedValue(UNDETERMINED);
  notifications.ensureNotificationPermission.mockResolvedValue(true);
});

/*
Motion is reduced throughout the cases that walk the flow: the step then
changes on the press rather than waiting on a native transition that never
reports back under the runner.
*/
async function renderFlow({ reduceMotion = true } = {}) {
  useReducedMotion.mockReturnValue(reduceMotion);
  return renderWithProviders(<OnboardingFlow />);
}

describe("the step on screen", () => {
  it("should open on the first step", async () => {
    const { getByText } = await renderFlow();

    expect(getByText(WELCOME.title)).toBeOnTheScreen();
    expect(getByText(WELCOME.description)).toBeOnTheScreen();
  });

  it("should count the step out of the steps there are", async () => {
    const { getByText } = await renderFlow();

    expect(getByText(`1/${STEPS.length}`)).toBeOnTheScreen();
  });

  it("should move the counter on with the step", async () => {
    const { getByRole, getByText } = await renderFlow();

    await fireEvent.press(getByRole("button", { name: WELCOME.cta }));

    expect(getByText(`2/${STEPS.length}`)).toBeOnTheScreen();
    expect(getByText(CONSISTENCY.title)).toBeOnTheScreen();
  });

  it("should reach the last step and name what it asks for", async () => {
    const { getByRole, getByText } = await renderFlow();

    await fireEvent.press(getByRole("button", { name: WELCOME.cta }));
    await fireEvent.press(getByRole("button", { name: CONSISTENCY.cta }));

    expect(getByText(`${STEPS.length}/${STEPS.length}`)).toBeOnTheScreen();
    expect(getByText(REMINDERS.title)).toBeOnTheScreen();
    expect(getByRole("button", { name: REMINDERS.cta })).toBeOnTheScreen();
  });

  it("should draw the artwork each step carries", async () => {
    const { container, getByRole } = await renderFlow();

    expect(symbolViews(container).map((symbol) => symbol.props.name)).toEqual([
      "figure.walk",
      "checkmark",
      "arrow.right",
    ]);

    await fireEvent.press(getByRole("button", { name: WELCOME.cta }));

    expect(symbolViews(container).map((symbol) => symbol.props.name)).toEqual([
      /* The way back arrives with the second step. */
      "chevron.left",
      "square.grid.3x3.fill",
      "flame.fill",
      "rectangle.3.group.fill",
      "arrow.right",
    ]);
  });
});

describe("the progress dots", () => {
  it("should draw one dot per step", async () => {
    const { container } = await renderFlow();

    expect(dots(container)).toHaveLength(STEPS.length);
  });

  it("should widen the dot of the step being shown", async () => {
    const { container } = await renderFlow();

    expect(dots(container)).toEqual([
      { width: CURRENT_DOT_WIDTH, filled: true },
      { width: DOT_HEIGHT, filled: false },
      { width: DOT_HEIGHT, filled: false },
    ]);
  });

  it("should fill the steps already behind it", async () => {
    const { container, getByRole } = await renderFlow();

    await fireEvent.press(getByRole("button", { name: WELCOME.cta }));

    expect(dots(container)).toEqual([
      { width: DOT_HEIGHT, filled: true },
      { width: CURRENT_DOT_WIDTH, filled: true },
      { width: DOT_HEIGHT, filled: false },
    ]);
  });

  it("should tint the steps still ahead with the system fill", async () => {
    const { container } = await renderFlow();

    const tints = container
      .queryAll(
        (node) => StyleSheet.flatten(node.props.style)?.height === DOT_HEIGHT,
      )
      .map((dot) => StyleSheet.flatten(dot.props.style).backgroundColor);

    expect(tints).toEqual([
      accent,
      Color.ios.tertiarySystemFill,
      Color.ios.tertiarySystemFill,
    ]);
  });
});

describe("going back", () => {
  it("should offer no way back from the first step", async () => {
    const { queryByLabelText } = await renderFlow();

    expect(queryByLabelText("Previous step")).toBeNull();
  });

  it("should name the way back for a screen reader", async () => {
    const { getByRole, getByLabelText } = await renderFlow();

    await fireEvent.press(getByRole("button", { name: WELCOME.cta }));

    expect(getByLabelText("Previous step")).toBeOnTheScreen();
  });

  it("should return to the step before it", async () => {
    const { getByRole, getByText } = await renderFlow();
    await fireEvent.press(getByRole("button", { name: WELCOME.cta }));

    await fireEvent.press(getByRole("button", { name: "Previous step" }));

    expect(getByText(WELCOME.title)).toBeOnTheScreen();
    expect(getByText(`1/${STEPS.length}`)).toBeOnTheScreen();
  });
});

describe("the last step", () => {
  async function renderLastStep(permission = UNDETERMINED) {
    notifications.getNotificationPermission.mockResolvedValue(permission);
    const view = await renderFlow();
    await fireEvent.press(view.getByRole("button", { name: WELCOME.cta }));
    await fireEvent.press(view.getByRole("button", { name: CONSISTENCY.cta }));
    return view;
  }

  it("should name the way past notifications for a screen reader", async () => {
    const { getByLabelText } = await renderLastStep();

    expect(getByLabelText("Skip notifications")).toBeOnTheScreen();
  });

  it("should offer no way past notifications before the last step", async () => {
    const { queryByLabelText } = await renderFlow();

    expect(queryByLabelText("Skip notifications")).toBeNull();
  });

  it("should finish onboarding when notifications are skipped", async () => {
    const { getByRole } = await renderLastStep();

    await fireEvent.press(getByRole("button", { name: "Skip notifications" }));

    expect(setOnboarded).toHaveBeenCalledTimes(1);
    expect(notifications.ensureNotificationPermission).not.toHaveBeenCalled();
  });

  it("should show notifications as allowed once they are", async () => {
    const { getByText, queryByLabelText } = await renderLastStep(ALLOWED);

    expect(getByText("Notifications are allowed")).toBeOnTheScreen();
    expect(queryByLabelText("Skip notifications")).toBeNull();
  });

  it("should offer to start tracking once notifications are allowed", async () => {
    const { getByRole } = await renderLastStep(ALLOWED);

    expect(getByRole("button", { name: "Start tracking" })).toBeOnTheScreen();
  });

  it("should seal the last step with a checkmark rather than an arrow", async () => {
    const { container } = await renderLastStep();

    const names = symbolViews(container).map((symbol) => symbol.props.name);
    expect(names).toContain("checkmark");
    expect(names).not.toContain("arrow.right");
  });
});

describe("when motion is reduced", () => {
  it("should render the step without the transition wrapper", async () => {
    const { container, getByText } = await renderFlow({ reduceMotion: true });

    expect(transitionViews(container)).toEqual([]);
    expect(getByText(WELCOME.title)).toBeOnTheScreen();
  });

  it("should wrap the step in the transition otherwise", async () => {
    const { container, getByText } = await renderFlow({ reduceMotion: false });

    expect(transitionViews(container)).toHaveLength(1);
    expect(getByText(WELCOME.title)).toBeOnTheScreen();
  });

  it("should hold the outgoing step on screen until the transition ends", async () => {
    const { container, getByRole, getByText } = await renderFlow({
      reduceMotion: false,
    });

    await fireEvent.press(getByRole("button", { name: WELCOME.cta }));

    const [transition] = transitionViews(container);
    expect(transition.props.animateOpacity).toBe(0);
    expect(getByText(WELCOME.title)).toBeOnTheScreen();
  });

  it("should show the next step once the transition reports back", async () => {
    const { container, getByRole, getByText } = await renderFlow({
      reduceMotion: false,
    });
    await fireEvent.press(getByRole("button", { name: WELCOME.cta }));

    await fireEvent(transitionViews(container)[0], "transitionEnd", {
      nativeEvent: { finished: true },
    });

    expect(getByText(CONSISTENCY.title)).toBeOnTheScreen();
    expect(getByText(`2/${STEPS.length}`)).toBeOnTheScreen();
  });
});

