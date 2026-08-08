import { routes } from "@/lib/utils/routes";

describe("routes", () => {
  it("should send an empty form to the form without a habit", () => {
    expect(routes.habitForm()).toBe("/habit-form");
  });

  it("should carry the habit into the form it is editing", () => {
    expect(routes.habitForm("h1")).toBe("/habit-form?id=h1");
  });

  it("should address a habit's detail by its id in the path", () => {
    expect(routes.habitDetail("h1")).toBe("/habit/h1");
  });

  it("should address a habit's history by its id in the query", () => {
    expect(routes.habitHistory("h1")).toBe("/habit-history?id=h1");
  });

  it("should send a screen with nothing behind it to the first tab", () => {
    expect(routes.home()).toBe("/");
  });
});
