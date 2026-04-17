import { describe, expect, it, vi } from "vitest";
import { createDocumentFromUpload } from "@/lib/documents/create-document-from-upload";

describe("createDocumentFromUpload", () => {
  it("rejects non-markdown files", async () => {
    const file = createFile("{}", "bad.json", "application/json");

    await expect(
      createDocumentFromUpload({
        ownerId: "user_123",
        file,
        prisma: vi.fn() as never,
      }),
    ).rejects.toMatchObject({
      name: "DocumentUploadValidationError",
      message: "Only Markdown files are supported",
    });
  });

  it("creates a document with a title derived from the filename and parsed blocks", async () => {
    const file = createFile("# Hello\n\nalpha beta", "lesson-notes.md", "text/markdown");
    const create = vi.fn().mockResolvedValue({ id: "doc_123" });

    const result = await createDocumentFromUpload({
      ownerId: "user_123",
      file,
      prisma: {
        document: {
          create,
        },
      } as never,
    });

    expect(result).toEqual({ id: "doc_123" });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        ownerId: "user_123",
        title: "lesson-notes",
        originalName: "lesson-notes.md",
        rawMarkdown: "# Hello\n\nalpha beta",
        blocks: {
          create: [
            {
              blockKey: expect.stringMatching(/^heading:[0-9a-f]{8}$/),
              sortOrder: 0,
              kind: "heading",
              text: "Hello",
            },
            {
              blockKey: expect.stringMatching(/^paragraph:[0-9a-f]{8}$/),
              sortOrder: 1,
              kind: "paragraph",
              text: "alpha beta",
            },
          ],
        },
      },
    });
  });

  it("persists successfully when there are zero highlight matches", async () => {
    const file = createFile("alpha beta", "plain.md", "text/markdown");
    const create = vi.fn().mockResolvedValue({ id: "doc_456" });

    await expect(
      createDocumentFromUpload({
        ownerId: "user_123",
        file,
        prisma: {
          document: {
            create,
          },
        } as never,
      }),
    ).resolves.toEqual({ id: "doc_456" });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      data: {
        ownerId: "user_123",
        title: "plain",
        originalName: "plain.md",
        rawMarkdown: "alpha beta",
      },
    });
    expect(create.mock.calls[0][0].data.highlightMatches).toBeUndefined();
  });
});

function createFile(contents: string, name: string, type: string) {
  const file = new File([contents], name, { type });

  return Object.assign(file, {
    text: vi.fn().mockResolvedValue(contents),
  });
}
