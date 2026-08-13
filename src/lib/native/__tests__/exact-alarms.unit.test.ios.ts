import { needsExactAlarmAccess } from "@/lib/native/exact-alarms";

describe("needsExactAlarmAccess", () => {
  it("should report nothing to ask for, because exact alarms are an Android grant", () => {
    expect(needsExactAlarmAccess()).toBe(false);
  });
});
