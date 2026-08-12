import { HABIT_ICONS } from "@/constants/habit-options";
import {
  MATERIAL_SYMBOL_BY_SF,
  crossPlatformSymbol,
  materialSymbolFor,
} from "@/lib/utils/icons";

describe("the Material name a symbol resolves to", () => {
  it("should cover every icon a habit can be given", () => {
    const unmapped = HABIT_ICONS.filter((icon) => !(icon in MATERIAL_SYMBOL_BY_SF));

    expect(unmapped).toEqual([]);
  });

  it("should translate a name it knows", () => {
    expect(materialSymbolFor("flame.fill")).toBe("local_fire_department");
  });

  it("should fall back rather than throw on a name it does not know", () => {
    expect(materialSymbolFor("nonexistent.symbol")).toBe("question_mark");
  });
});

describe("the symbol a view is given", () => {
  it("should carry the stored name for iOS and the translation for Android", () => {
    expect(crossPlatformSymbol("book.fill")).toEqual({
      ios: "book.fill",
      android: "menu_book",
      web: "menu_book",
    });
  });
});
