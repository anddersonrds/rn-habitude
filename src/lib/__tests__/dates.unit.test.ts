import {
  addDays,
  dateKey,
  formatFullDate,
  formatMonthShort,
  formatTime,
  parseKey,
  todayKey,
  weekdayInitials,
  weekdayOf,
} from "@/lib/dates";
import { freezeClock, restoreClock } from "@/test-utils/time";

/*
The suite is pinned to America/Sao_Paulo, which observed daylight saving until
2019. The transitions below are the ones that still exist in the zone's data,
and they are the only local dates in this file that are not arbitrary.
*/
const DST_STARTS = "2018-11-04";
const DST_ENDS = "2019-02-17";

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

describe("todayKey", () => {
  afterEach(restoreClock);

  it("should return the key of the frozen instant", () => {
    freezeClock("2026-07-29T12:00:00-03:00");
    expect(todayKey()).toBe("2026-07-29");
  });

  it("should still return the local day when the instant is already tomorrow in UTC", () => {
    freezeClock("2026-07-29T23:30:00-03:00");
    expect(todayKey()).toBe("2026-07-29");
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

  it("should round trip across a month boundary", () => {
    expect(dateKey(parseKey("2026-01-31"))).toBe("2026-01-31");
  });

  it("should round trip across a year boundary", () => {
    expect(dateKey(parseKey("2025-12-31"))).toBe("2025-12-31");
  });

  it("should round trip on the day daylight saving starts, whose local midnight never happened", () => {
    /*
    The clock jumped from 23:59 to 01:00, so this key has no midnight and the
    Date lands an hour later. The key it formats back to is what matters.
    */
    expect(parseKey(DST_STARTS).getHours()).toBe(1);
    expect(dateKey(parseKey(DST_STARTS))).toBe(DST_STARTS);
  });

  it("should round trip on the day daylight saving ends, whose local midnight happened twice", () => {
    expect(dateKey(parseKey(DST_ENDS))).toBe(DST_ENDS);
  });
});

describe("addDays", () => {
  it("should cross into the next month", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("should cross back into the previous month", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("should cross into the next year", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("should cross back into the previous year", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("should return the same key for no offset", () => {
    expect(addDays("2026-07-29", 0)).toBe("2026-07-29");
  });

  it("should reach the leap day in a leap year", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("should step over a daylight saving transition without losing or gaining a day", () => {
    expect(addDays(addDays(DST_STARTS, -1), 1)).toBe(DST_STARTS);
    expect(addDays(DST_ENDS, -1)).toBe("2019-02-16");
  });
});

describe("weekdayOf", () => {
  it("should return 0 for a Sunday", () => {
    expect(weekdayOf("2026-07-26")).toBe(0);
  });

  it("should return 6 for a Saturday", () => {
    expect(weekdayOf("2026-08-01")).toBe(6);
  });

  it("should return 3 for a Wednesday", () => {
    expect(weekdayOf("2026-07-29")).toBe(3);
  });
});

describe("formatTime", () => {
  it("should format an afternoon time in English", () => {
    expect(formatTime("13:30", "en")).toBe("1:30 PM");
  });

  it("should format midnight as 12 AM rather than 0", () => {
    expect(formatTime("00:00", "en")).toBe("12:00 AM");
  });

  it("should zero-pad the minutes and leave the hour unpadded", () => {
    expect(formatTime("09:05", "en")).toBe("9:05 AM");
  });

  it("should follow the language it is given rather than the runner's", () => {
    /* The runner is pinned to `en_US`, so a 24-hour clock can only have come
    from the argument. */
    expect(formatTime("13:30", "fr")).toBe("13:30");
  });
});

describe("formatFullDate", () => {
  it("should format a key with its weekday, month and day", () => {
    expect(formatFullDate("2026-07-29", "en")).toBe("Wednesday, July 29");
  });

  it("should not pad a single-digit day", () => {
    expect(formatFullDate("2026-01-05", "en")).toBe("Monday, January 5");
  });

  it("should follow the language it is given rather than the runner's", () => {
    expect(formatFullDate("2026-07-29", "fr")).toBe("mercredi 29 juillet");
    expect(formatFullDate("2026-07-29", "ja")).toBe("7月29日水曜日");
  });
});

describe("formatMonthShort", () => {
  it("should abbreviate the month the key falls in", () => {
    expect(formatMonthShort("2026-07-29", "en")).toBe("Jul");
  });

  it("should follow the language it is given rather than the runner's", () => {
    expect(formatMonthShort("2026-07-29", "fr")).toBe("juil.");
    expect(formatMonthShort("2026-07-29", "ja")).toBe("7月");
  });
});

describe("weekdayInitials", () => {
  it("should start the list on Sunday, whatever the language", () => {
    /* The list is indexed by `weekdayOf`, where 0 is Sunday. Where a week
    starts on screen is the grid's business, not this list's. */
    expect(weekdayInitials("en")).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
  });

  it("should follow the language it is given rather than the runner's", () => {
    expect(weekdayInitials("fr")).toEqual(["D", "L", "M", "M", "J", "V", "S"]);
    expect(weekdayInitials("ja")).toEqual([
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土",
    ]);
  });
});
