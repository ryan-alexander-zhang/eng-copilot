import { describe, expect, it } from "vitest";
import {
  BUILT_IN_EXCLUSION,
  BUILT_IN_EXCLUSION_SLUG,
  BUILT_IN_LISTS,
} from "@/lib/word-lists/catalog";

describe("built-in word-list catalog", () => {
  it("declares the built-in academic lists and one exclusion list", () => {
    expect(BUILT_IN_LISTS.map((list) => list.slug)).toEqual([
      "cet4",
      "cet6",
      "ielts",
      "toefl",
      "gre",
    ]);
    expect(BUILT_IN_LISTS.map((list) => list.fileName)).toEqual([
      "cet4.txt",
      "cet6.txt",
      "ielts.txt",
      "toefl.txt",
      "gre.txt",
    ]);
    expect(BUILT_IN_EXCLUSION_SLUG).toBe("builtin-exclusion");
    expect(BUILT_IN_EXCLUSION).toEqual({
      slug: "builtin-exclusion",
      name: "Built-in Exclusions",
      fileName: "exclusion.txt",
    });
  });
});
