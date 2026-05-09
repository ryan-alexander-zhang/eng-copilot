import { describe, expect, it } from "vitest";
import { getOptionalFormString } from "@/lib/vocabulary/form";

describe("getOptionalFormString", () => {
  it("returns null for empty form values instead of throwing", () => {
    const formData = new FormData();

    expect(getOptionalFormString(formData, "word")).toBeNull();

    formData.set("word", "   ");

    expect(getOptionalFormString(formData, "word")).toBeNull();
  });

  it("returns trimmed form values", () => {
    const formData = new FormData();

    formData.set("word", "  Observability  ");

    expect(getOptionalFormString(formData, "word")).toBe("Observability");
  });
});
