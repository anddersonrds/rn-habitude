import { formatCount, formatPercent } from "@/lib/numbers";

/*
The runner is pinned to `en_US` (see `test-utils/time.ts`), so every case that
names a second language is asserting that the argument won, not the machine.
*/

describe("formatCount", () => {
  it("should leave a number under a thousand as its own digits", () => {
    expect(formatCount(42, "en")).toBe("42");
  });

  it("should group thousands the way the language groups them", () => {
    expect(formatCount(1234, "en")).toBe("1,234");
    expect(formatCount(1234, "de")).toBe("1.234");
  });

  it("should count nothing as zero rather than as blank", () => {
    expect(formatCount(0, "en")).toBe("0");
  });
});

describe("formatPercent", () => {
  it("should take the fraction and render it as a percentage", () => {
    expect(formatPercent(0.83, "en")).toBe("83%");
  });

  it("should round to whole percentage points", () => {
    expect(formatPercent(0.835, "en")).toBe("84%");
    expect(formatPercent(0.834, "en")).toBe("83%");
  });

  it("should space the sign the way the language spaces it", () => {
    /* French and German put a space before the sign; English does not. */
    expect(formatPercent(0.83, "fr")).not.toBe("83%");
    expect(formatPercent(0.83, "fr").replace(/\s/g, "")).toBe("83%");
  });

  it("should render a complete run as a hundred per cent", () => {
    expect(formatPercent(1, "en")).toBe("100%");
  });
});
