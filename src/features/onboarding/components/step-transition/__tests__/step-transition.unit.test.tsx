import { StepTransition } from "@/features/onboarding/components/step-transition";
import { renderWithProviders } from "@/test-utils/render";
import { fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import type { TestInstance } from "test-renderer";

function transitionViews(container: TestInstance): TestInstance[] {
  return container.queryAll((node) => node.type === "EaseView");
}

const step = <Text>The step</Text>;

describe("StepTransition", () => {
  it("should mount the step bare when motion is reduced", async () => {
    const { container, getByText } = await renderWithProviders(
      <StepTransition reduceMotion visible onTransitionEnd={jest.fn()}>
        {step}
      </StepTransition>,
    );

    expect(transitionViews(container)).toEqual([]);
    expect(getByText("The step")).toBeOnTheScreen();
  });

  it("should wrap the step in the transition otherwise", async () => {
    const { container, getByText } = await renderWithProviders(
      <StepTransition reduceMotion={false} visible onTransitionEnd={jest.fn()}>
        {step}
      </StepTransition>,
    );

    expect(transitionViews(container)).toHaveLength(1);
    expect(getByText("The step")).toBeOnTheScreen();
  });

  it("should fade the step out while it is on its way off", async () => {
    const { container } = await renderWithProviders(
      <StepTransition
        reduceMotion={false}
        visible={false}
        onTransitionEnd={jest.fn()}
      >
        {step}
      </StepTransition>,
    );

    expect(transitionViews(container)[0].props.animateOpacity).toBe(0);
  });

  it("should hold the outgoing step on screen until the fade is over", async () => {
    const { getByText } = await renderWithProviders(
      <StepTransition
        reduceMotion={false}
        visible={false}
        onTransitionEnd={jest.fn()}
      >
        {step}
      </StepTransition>,
    );

    expect(getByText("The step")).toBeOnTheScreen();
  });

  it("should report back once the fade ends", async () => {
    const onTransitionEnd = jest.fn();
    const { container } = await renderWithProviders(
      <StepTransition
        reduceMotion={false}
        visible={false}
        onTransitionEnd={onTransitionEnd}
      >
        {step}
      </StepTransition>,
    );

    await fireEvent(transitionViews(container)[0], "transitionEnd", {
      nativeEvent: { finished: true },
    });

    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it("should never report back when motion is reduced, because nothing fades", async () => {
    const onTransitionEnd = jest.fn();
    await renderWithProviders(
      <StepTransition reduceMotion visible={false} onTransitionEnd={onTransitionEnd}>
        {step}
      </StepTransition>,
    );

    expect(onTransitionEnd).not.toHaveBeenCalled();
  });
});
