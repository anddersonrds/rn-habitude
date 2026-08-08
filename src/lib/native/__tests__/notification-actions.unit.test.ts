import { MARK_DONE_ACTION } from "@/lib/native/notifications";
import { useNotificationActions } from "@/lib/native/notification-actions";
import { completeHabit } from "@/lib/data/store";
import { freezeClock, restoreClock } from "@/test-utils/time";
import { renderHook } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn(async () => {}),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

/* The store is the boundary this hook writes through; its own tests own the SQL. */
jest.mock("@/lib/data/store", () => ({ completeHabit: jest.fn() }));

const notifications = jest.mocked(Notifications);
const complete = jest.mocked(completeHabit);

const TODAY = "2026-07-29";

/** The shape `expo-notifications` delivers for a tapped action button. */
function response(
  actionIdentifier: string,
  data: Record<string, unknown>,
): Notifications.NotificationResponse {
  return {
    actionIdentifier,
    notification: { request: { content: { data } } },
  } as never;
}

/** The handler the hook hands to the listener while the app is running. */
function deliverToListener(
  received: Notifications.NotificationResponse,
): void {
  const [handler] =
    notifications.addNotificationResponseReceivedListener.mock.calls[0];
  handler(received);
}

beforeEach(() => {
  jest.clearAllMocks();
  freezeClock(`${TODAY}T12:00:00-03:00`);
  notifications.getLastNotificationResponse.mockReturnValue(null);
  notifications.addNotificationResponseReceivedListener.mockReturnValue({
    remove: jest.fn(),
  } as never);
});

afterEach(restoreClock);

describe("useNotificationActions", () => {
  it("should register the reminder category so the action button exists", async () => {
    await renderHook(() => useNotificationActions());

    expect(notifications.setNotificationCategoryAsync).toHaveBeenCalled();
  });

  it("should check the habit in when the app was cold started by the action", async () => {
    notifications.getLastNotificationResponse.mockReturnValue(
      response(MARK_DONE_ACTION, { habitId: "habit-1" }),
    );

    await renderHook(() => useNotificationActions());

    expect(complete).toHaveBeenCalledWith("habit-1", TODAY);
  });

  it("should clear the cold start response so a later mount does not replay it", async () => {
    notifications.getLastNotificationResponse.mockReturnValue(
      response(MARK_DONE_ACTION, { habitId: "habit-1" }),
    );

    await renderHook(() => useNotificationActions());

    expect(notifications.clearLastNotificationResponse).toHaveBeenCalled();
  });

  it("should check the habit in when the action arrives while the app is running", async () => {
    await renderHook(() => useNotificationActions());

    deliverToListener(response(MARK_DONE_ACTION, { habitId: "habit-2" }));

    expect(complete).toHaveBeenCalledWith("habit-2", TODAY);
  });

  it("should do nothing when the app was started by something other than the action", async () => {
    await renderHook(() => useNotificationActions());

    deliverToListener(response("default", { habitId: "habit-1" }));

    expect(complete).not.toHaveBeenCalled();
  });

  it("should do nothing when the response carries no habit id", async () => {
    await renderHook(() => useNotificationActions());

    deliverToListener(response(MARK_DONE_ACTION, {}));

    expect(complete).not.toHaveBeenCalled();
  });

  it("should do nothing when the habit id is not a string", async () => {
    await renderHook(() => useNotificationActions());

    deliverToListener(response(MARK_DONE_ACTION, { habitId: 7 }));

    expect(complete).not.toHaveBeenCalled();
  });

  it("should do nothing when there was no cold start response at all", async () => {
    await renderHook(() => useNotificationActions());

    expect(complete).not.toHaveBeenCalled();
  });

  it("should stop listening once the app tears the hook down", async () => {
    const remove = jest.fn();
    notifications.addNotificationResponseReceivedListener.mockReturnValue({
      remove,
    } as never);

    const { unmount } = await renderHook(() => useNotificationActions());
    await unmount();

    expect(remove).toHaveBeenCalled();
  });
});
