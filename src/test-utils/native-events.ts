/**
 * These helpers cover the JavaScript half of the bridge only. They dispatch the
 * event a SwiftUI gesture would produce; they do not prove the gesture works on
 * a device. No coverage number produced with them says anything about hit
 * testing, swipe mechanics, or whether a row can actually be dragged.
 *
 * Prop names below are the ones the native views really receive, read off
 * `@expo/ui`'s own sources. Several differ from the prop the app writes: a
 * `Button`'s `onPress` reaches the native view as `onButtonPress`, and a
 * modifier gesture arrives on `onGlobalEvent` keyed by the modifier's `$type`
 * rather than as a prop of its own.
 */
import { fireEvent } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";

/**
 * Fires the handler after checking the target carries it, so a renamed prop
 * fails as a clear error instead of as a test that silently asserts nothing.
 */
async function dispatch(
  target: TestInstance,
  prop: string,
  payload?: unknown,
): Promise<void> {
  if (typeof target.props[prop] !== "function") {
    const carried = Object.keys(target.props)
      .filter((name) => name.startsWith("on"))
      .join(", ");
    throw new Error(
      `Expected the target to carry \`${prop}\`, but it carries: ${carried || "no handlers"}.`,
    );
  }
  // Strip the `on` and lower the next letter: that is the event name the
  // renderer maps back onto the prop.
  const eventName = prop.charAt(2).toLowerCase() + prop.slice(3);
  await fireEvent(target, eventName, payload);
}

/** Taps a view carrying an `onTapGesture` modifier. */
export function tapNative(target: TestInstance): Promise<void> {
  return dispatch(target, "onGlobalEvent", { nativeEvent: { onTapGesture: {} } });
}

/** Presses a native button, including the buttons inside a swipe action group. */
export function pressButton(target: TestInstance): Promise<void> {
  return dispatch(target, "onButtonPress");
}

/** Types into a text field, replacing its contents. */
export function typeInto(target: TestInstance, text: string): Promise<void> {
  return dispatch(target, "onChangeText", text);
}

/**
 * Flips a switch to a value. The switch's own `onValueChange` never reaches the
 * host node: React Native reads the value off the native `onChange` payload and
 * calls it from there.
 */
export function toggleSwitch(target: TestInstance, value: boolean): Promise<void> {
  return dispatch(target, "onChange", { nativeEvent: { value } });
}

/** Drags a row from one index to another inside a reorderable list. */
export function moveRow(
  target: TestInstance,
  from: number,
  to: number,
): Promise<void> {
  return dispatch(target, "onMove", {
    nativeEvent: { sourceIndices: [from], destination: to },
  });
}

/** Picks an option from a segmented control or a menu. */
export function chooseOption(
  target: TestInstance,
  selection: string | number,
): Promise<void> {
  return dispatch(target, "onSelectionChange", { nativeEvent: { selection } });
}

/** Picks a date or a time from a date picker. */
export function pickDate(target: TestInstance, date: Date): Promise<void> {
  return dispatch(target, "onDateChange", { nativeEvent: { date } });
}
