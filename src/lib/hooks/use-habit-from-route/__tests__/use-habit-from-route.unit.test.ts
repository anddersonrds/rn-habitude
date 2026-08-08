import { useHabitFromRoute } from "@/lib/hooks/use-habit-from-route";
import type { Habit } from "@/lib/domain/types";
import { makeHabit } from "@/test-utils/factories";
import { renderHook } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: jest.fn(() => ({}) as Record<string, string>),
}));

const routing = {
  back: router.back as jest.Mock,
  canGoBack: router.canGoBack as jest.Mock,
  params: useLocalSearchParams as unknown as jest.Mock,
};

const READ = makeHabit({ id: "h1", name: "Read" });
const STRETCH = makeHabit({ id: "h2", name: "Stretch" });

async function renderGuard(habits: Habit[], id: string) {
  routing.params.mockReturnValue({ id });
  return renderHook(({ list }: { list: Habit[] }) => useHabitFromRoute(list), {
    initialProps: { list: habits },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  routing.canGoBack.mockReturnValue(true);
});

describe("useHabitFromRoute", () => {
  it("should hand back the habit the route points at", async () => {
    const { result } = await renderGuard([READ, STRETCH], "h2");

    expect(result.current).toBe(STRETCH);
    expect(routing.back).not.toHaveBeenCalled();
  });

  it("should give nothing back and leave when the habit is not there", async () => {
    const { result } = await renderGuard([READ], "gone");

    expect(result.current).toBeUndefined();
    expect(routing.back).toHaveBeenCalledTimes(1);
  });

  it("should stay put when there is nowhere to go back to", async () => {
    routing.canGoBack.mockReturnValue(false);

    const { result } = await renderGuard([READ], "gone");

    expect(result.current).toBeUndefined();
    expect(routing.back).not.toHaveBeenCalled();
  });

  it("should leave once the habit it was showing is deleted", async () => {
    const { result, rerender } = await renderGuard([READ], "h1");
    expect(result.current).toBe(READ);

    await rerender({ list: [] });

    expect(result.current).toBeUndefined();
    expect(routing.back).toHaveBeenCalledTimes(1);
  });
});
