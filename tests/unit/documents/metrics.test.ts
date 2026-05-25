import { describe, expect, it } from "vitest";
import { countWords } from "@/lib/documents/metrics";

describe("countWords", () => {
  it("ignores html comments embedded in markdown", () => {
    expect(countWords("alpha <!-- hidden hidden --> beta")).toBe(2);
  });

  it("counts visible words across multiline markdown", () => {
    expect(
      countWords(["alpha beta", "", "<!-- hidden hidden -->", "", "gamma"].join("\n")),
    ).toBe(3);
  });
});
