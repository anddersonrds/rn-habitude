import { switchLanguage, useLanguageSwitch } from "@/i18n/switching";
import { act, renderHook } from "@testing-library/react-native";

describe("the fade a language change rides on", () => {
  it("should start visible, with nothing waiting", async () => {
    const { result, unmount } = await renderHook(() => useLanguageSwitch());

    expect(result.current.visible).toBe(true);
    await unmount();
  });

  it("should fade out without applying the change yet", async () => {
    const { result, unmount } = await renderHook(() => useLanguageSwitch());
    const change = jest.fn();

    await act(async () => switchLanguage(change));

    expect(result.current.visible).toBe(false);
    expect(change).not.toHaveBeenCalled();
    await unmount();
  });

  it("should apply the change and fade back in once the fade reports back", async () => {
    const { result, unmount } = await renderHook(() => useLanguageSwitch());
    const change = jest.fn();
    await act(async () => switchLanguage(change));

    await act(async () => result.current.onTransitionEnd());

    expect(change).toHaveBeenCalledTimes(1);
    expect(result.current.visible).toBe(true);
    await unmount();
  });

  it("should apply a change once, however many times the fade reports", async () => {
    const { result, unmount } = await renderHook(() => useLanguageSwitch());
    const change = jest.fn();
    await act(async () => switchLanguage(change));

    await act(async () => result.current.onTransitionEnd());
    await act(async () => result.current.onTransitionEnd());

    expect(change).toHaveBeenCalledTimes(1);
    expect(result.current.visible).toBe(true);
    await unmount();
  });

  it("should tell every subscriber, not only the one that asked", async () => {
    const first = await renderHook(() => useLanguageSwitch());
    const second = await renderHook(() => useLanguageSwitch());

    await act(async () => switchLanguage(() => {}));

    expect(first.result.current.visible).toBe(false);
    expect(second.result.current.visible).toBe(false);
    await act(async () => first.result.current.onTransitionEnd());
    await first.unmount();
    await second.unmount();
  });
});
