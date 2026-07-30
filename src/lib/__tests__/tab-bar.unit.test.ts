/* eslint-disable @typescript-eslint/no-require-imports --
`import * as React` is a copy of the module's exports, and a spy on a copy is
never called. See `captureSubscription`.
*/
import { setTabBarHidden, useTabBarHidden } from "@/lib/tab-bar";
import { act, renderHook } from "@testing-library/react-native";

async function subscriber() {
  return renderHook(() => useTabBarHidden());
}

/**
 * The subscription the hook hands React. Taking it directly is the only way to
 * see a notification: React re-reads the value and bails out when it has not
 * moved, so an extra notification is invisible from a rendered subscriber.
 */
async function captureSubscription(): Promise<
  (listener: () => void) => () => void
> {
  const useStore = jest.spyOn(
    require("react") as typeof import("react"),
    "useSyncExternalStore",
  );
  const { unmount } = await subscriber();
  const [subscribe] = useStore.mock.calls[0];
  await unmount();
  useStore.mockRestore();
  return subscribe;
}

/* The flag is module state, so a case that flips it has to flip it back. */
afterEach(() => setTabBarHidden(false));

describe("useTabBarHidden", () => {
  it("should start with the tab bar visible", async () => {
    const { result } = await subscriber();

    expect(result.current).toBe(false);
  });

  it("should follow the flag when a screen takes the viewport", async () => {
    const { result } = await subscriber();

    await act(async () => setTabBarHidden(true));

    expect(result.current).toBe(true);
  });

  it("should follow the flag back when the screen gives the viewport up", async () => {
    const { result } = await subscriber();
    await act(async () => setTabBarHidden(true));

    await act(async () => setTabBarHidden(false));

    expect(result.current).toBe(false);
  });

  it("should notify every subscriber, not just the first", async () => {
    const first = await subscriber();
    const second = await subscriber();

    await act(async () => setTabBarHidden(true));

    expect([first.result.current, second.result.current]).toEqual([true, true]);
  });

  it("should leave a subscriber that unmounted out of it", async () => {
    const { result, unmount } = await subscriber();
    await unmount();

    await act(async () => setTabBarHidden(true));

    expect(result.current).toBe(false);
  });
});

describe("setTabBarHidden", () => {
  it("should notify on a change", async () => {
    const subscribe = await captureSubscription();
    const notified = jest.fn();
    subscribe(notified);

    setTabBarHidden(true);

    expect(notified).toHaveBeenCalledTimes(1);
  });

  it("should not notify when the flag is set to what it already is", async () => {
    const subscribe = await captureSubscription();
    const notified = jest.fn();
    subscribe(notified);
    setTabBarHidden(true);

    setTabBarHidden(true);
    setTabBarHidden(true);

    expect(notified).toHaveBeenCalledTimes(1);
  });

  it("should stop notifying once the subscription is released", async () => {
    const subscribe = await captureSubscription();
    const notified = jest.fn();
    const release = subscribe(notified);

    release();
    setTabBarHidden(true);

    expect(notified).not.toHaveBeenCalled();
  });

  it("should read the same to a subscriber that mounts after the flag was set", async () => {
    setTabBarHidden(true);

    const { result } = await subscriber();

    expect(result.current).toBe(true);
  });
});
