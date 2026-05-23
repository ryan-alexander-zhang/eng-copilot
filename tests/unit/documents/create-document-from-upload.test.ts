import { Prisma } from "@prisma/client";
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
              blockPath: "0:heading",
              sortOrder: 0,
              kind: "heading",
              selectable: true,
              attrs: {
                depth: 1,
              },
              text: "Hello",
            },
            {
              blockKey: expect.stringMatching(/^paragraph:[0-9a-f]{8}$/),
              blockPath: "1:paragraph",
              sortOrder: 1,
              kind: "paragraph",
              selectable: true,
              attrs: Prisma.JsonNull,
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

  it("includes owner vocabulary terms from selected word lists when uploading", async () => {
    const file = createFile("Observability improves systems", "systems.md", "text/markdown");
    const create = vi.fn().mockResolvedValue({ id: "doc_789" });

    await createDocumentFromUpload({
      ownerId: "user_123",
      file,
      prisma: {
        document: {
          create,
        },
        userWordListPreference: {
          findMany: vi.fn().mockResolvedValue([{ wordListId: "list_cet6" }]),
        },
        vocabularyEntry: {
          findMany: vi.fn().mockResolvedValue([{ word: "observability" }]),
        },
        wordList: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "list_cet6",
              entries: [],
            },
          ]),
          findUnique: vi.fn().mockResolvedValue({
            entries: [],
          }),
        },
      } as never,
    });

    expect(create.mock.calls[0][0].data.highlightMatches).toEqual({
      create: [
        {
          blockKey: expect.stringMatching(/^paragraph:[0-9a-f]{8}$/),
          startOffset: 0,
          endOffset: 13,
          term: "observability",
        },
      ],
    });
  });
});

function createFile(contents: string, name: string, type: string) {
  const file = new File([contents], name, { type });

  return Object.assign(file, {
    text: vi.fn().mockResolvedValue(contents),
  });
}
