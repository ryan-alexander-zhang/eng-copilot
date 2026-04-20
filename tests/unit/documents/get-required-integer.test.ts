import { describe, expect, it } from "vitest";
import { getRequiredInteger } from "@/app/(app)/documents/[documentId]/page";

describe("getRequiredInteger", () => {
  it("rejects malformed integer strings", () => {
    const formData = new FormData();

    formData.append("value", "3abc");
    expect(() => getRequiredInteger(formData, "value")).toThrow("Invalid value");

    formData.set("value", "1.5");
    expect(() => getRequiredInteger(formData, "value")).toThrow("Invalid value");
  });
});
