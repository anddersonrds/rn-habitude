/**
 * Stands in for the navigation half of `expo-router`, leaving the rest of the
 * module - `Color` above all, which every screen styles itself with - real.
 *
 * A native stack cannot mount under the runner: its toolbar reads an option out
 * of a provider only the native navigator installs, and rendering one throws
 * before a screen draws anything. The stand-ins keep the accessible surface a
 * screen hands them, so the screen's own handlers are what a test presses, and
 * `router` is a spy the way any other boundary is.
 */
import type { ReactNode } from "react";
import { Pressable } from "react-native";

type ToolbarButtonProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
};

type LinkProps = { href: string; children?: ReactNode };

export function expoRouterMock() {
  const actual = jest.requireActual<typeof import("expo-router")>("expo-router");

  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    dismissAll: jest.fn(),
    setParams: jest.fn(),
  };

  /*
  The button is a real pressable; only the bar around it is a stand-in. An icon
  button is named by its label and a text button by its text, which is what the
  real bar reads out, and a disabled button refuses the press the way SwiftUI's
  own `disabled` does.
  */
  function ToolbarButton({
    accessibilityLabel,
    children,
    disabled,
    onPress,
  }: ToolbarButtonProps) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ??
          (typeof children === "string" ? children : undefined)
        }
        accessibilityState={{ disabled: disabled === true }}
        disabled={disabled}
        onPress={onPress}
      />
    );
  }

  function Toolbar({ children }: { children?: ReactNode }) {
    return <>{children}</>;
  }
  Toolbar.Button = ToolbarButton;

  /* Records the options a screen sets rather than drawing a header. */
  const Screen = jest.fn(() => null);

  const Stack = Object.assign(
    ({ children }: { children?: ReactNode }) => <>{children}</>,
    { Screen, Toolbar, Protected: ({ children }: { children?: ReactNode }) => <>{children}</> },
  );

  /* Records where the screen points; the trigger renders what it wraps. */
  const Link = Object.assign(
    jest.fn(({ children }: LinkProps) => <>{children}</>),
    { Trigger: ({ children }: { children?: ReactNode }) => <>{children}</> },
  );

  return {
    __esModule: true,
    ...actual,
    router,
    useLocalSearchParams: jest.fn(() => ({}) as Record<string, string>),
    useRouter: jest.fn(() => router),
    Stack,
    Link,
  };
}
