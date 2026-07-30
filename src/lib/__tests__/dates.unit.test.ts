import { addDays, dateKey, parseKey } from "@/lib/dates";

describe("dateKey", () => {
  it("should format a date as a local YYYY-MM-DD key", () => {
    expect(dateKey(new Date(2026, 6, 29))).toBe("2026-07-29");
  });

  it("should zero-pad a single-digit month and day", () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("should read the local date late at night, when UTC is already the next day", () => {
    expect(dateKey(new Date(2026, 6, 29, 23, 30))).toBe("2026-07-29");
  });
});

describe("parseKey", () => {
  it("should return local midnight for a key", () => {
    const parsed = parseKey("2026-07-29");
    expect([
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      parsed.getHours(),
    ]).toEqual([2026, 6, 29, 0]);
  });

  it("should round trip through dateKey", () => {
    expect(dateKey(parseKey("2026-02-28"))).toBe("2026-02-28");
  });
});

describe("addDays", () => {
  it("should cross into the next month", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("should cross back into the previous month", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("should return the same key for no offset", () => {
    expect(addDays("2026-07-29", 0)).toBe("2026-07-29");
  });
});
