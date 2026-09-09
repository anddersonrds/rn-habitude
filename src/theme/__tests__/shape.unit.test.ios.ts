import { continuousCorner } from "@/theme";

describe("the iOS corner", () => {
  it("should round a radius along the continuous curve", () => {
    expect(continuousCorner).toEqual({ borderCurve: "continuous" });
  });
});
