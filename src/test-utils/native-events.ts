/**
 * These helpers cover the JavaScript half of the bridge only. They dispatch the
 * event a SwiftUI gesture would produce, and prove nothing about hit testing,
 * swipe mechanics, or whether a row really drags on a device.
 *
 * The prop names are the ones the native views receive, read off `@expo/ui`'s
 * sources. Several differ from the prop the app writes.
 */
import { fireEvent } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";

/** Checks the target carries the handler, so a renamed prop fails clearly. */
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
  const eventName = prop.charAt(2).toLowerCase() + prop.slice(3);
  await fireEvent(target, eventName, payload);
}

/** Taps a view carrying an `onTapGesture` modifier. */
export function tapNative(target: TestInstance): Promise<void> {
  /* Modifier gestures all arrive on one prop, keyed by the modifier's type. */
  return dispatch(target, "onGlobalEvent", { nativeEvent: { onTapGesture: {} } });
}

/** Presses a native button, including those inside a swipe action group. */
export function pressButton(target: TestInstance): Promise<void> {
  return dispatch(target, "onButtonPress");
}

/** Types into a text field, replacing its contents. */
export function typeInto(target: TestInstance, text: string): Promise<void> {
  return dispatch(target, "onChangeText", text);
}

/** Flips a switch to a value. */
export function toggleSwitch(target: TestInstance, value: boolean): Promise<void> {
  /* `onValueChange` never reaches the host node: React Native reads the value
     off the native `onChange` payload and calls it from there. */
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
