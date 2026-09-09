import { appFontFamily, typography } from "@/theme";

/* A key the ramp does not carry is a variant that draws unstyled. */
const RAMP = [
  "largeTitle",
  "title",
  "title2",
  "title3",
  "headline",
  "body",
  "subheadline",
  "footnote",
  "caption",
];

describe("the iOS type ramp", () => {
  it("should carry every key a screen asks for", () => {
    expect(Object.keys(typography)).toEqual(RAMP);
  });

  it("should keep the sizes of the iOS text styles it mirrors", () => {
    expect(typography.largeTitle.fontSize).toBe(34);
    expect(typography.body.fontSize).toBe(17);
    expect(typography.caption.fontSize).toBe(12);
  });

  it("should keep the rounded family the SwiftUI screens draw in", () => {
    expect(appFontFamily).toBe("ui-rounded");
  });
});
