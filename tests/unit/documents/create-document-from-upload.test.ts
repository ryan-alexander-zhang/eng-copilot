import { describe, expect, it, vi } from "vitest";
import { createDocumentFromUpload } from "@/lib/documents/create-document-from-upload";

describe("createDocumentFromUpload", () => {
  it("rejects non-markdown files", async () => {
    const file = new File(["{}"], "bad.json", { type: "application/json" });

    await expect(
      createDocumentFromUpload({
        ownerId: "user_123",
        file,
        prisma: vi.fn() as never,
      }),
    ).rejects.toThrow("Only Markdown files are supported");
  });
});
