import { continuousCorner } from "@/theme";

describe("the Android corner", () => {
  it("should add nothing to a style, the platform having no such curve", () => {
    expect(continuousCorner).toEqual({});
  });
});
