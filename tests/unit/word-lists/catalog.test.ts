import { describe, expect, it } from "vitest";
import {
  BUILT_IN_EXCLUSION,
  BUILT_IN_EXCLUSION_SLUG,
  BUILT_IN_LISTS,
} from "@/lib/word-lists/catalog";

describe("built-in word-list catalog", () => {
  it("declares CET4, CET6, and one exclusion list", () => {
    expect(BUILT_IN_LISTS.map((list) => list.slug)).toEqual(["cet4", "cet6"]);
    expect(BUILT_IN_LISTS.map((list) => list.fileName)).toEqual([
      "cet4.txt",
      "cet6.txt",
    ]);
    expect(BUILT_IN_EXCLUSION_SLUG).toBe("builtin-exclusion");
    expect(BUILT_IN_EXCLUSION).toEqual({
      slug: "builtin-exclusion",
      name: "Built-in Exclusions",
      fileName: "exclusion.txt",
    });
  });
});
