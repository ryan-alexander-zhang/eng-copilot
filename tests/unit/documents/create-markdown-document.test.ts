import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { createMarkdownDocument } from "@/lib/documents/create-markdown-document";

describe("createMarkdownDocument", () => {
  it("persists clipped markdown with source URL and projection blocks", async () => {
    const create = vi.fn().mockResolvedValue({ id: "doc_clip" });

    const result = await createMarkdownDocument({
      ownerId: "user_123",
      title: "Clipped Article",
      originalName: "clipped-article.md",
      rawMarkdown: "# Hello\n\nalpha beta",
      sourceByteSize: 19,
      sourceUrl: "https://example.com/article",
      prisma: {
        document: {
          create,
        },
      } as never,
    });

    expect(result).toEqual({ id: "doc_clip" });
    expect(create).toHaveBeenCalledWith({
      data: {
        ownerId: "user_123",
        title: "Clipped Article",
        originalName: "clipped-article.md",
        sourceUrl: "https://example.com/article",
        sourceFormat: "MARKDOWN",
        rawMarkdown: "# Hello\n\nalpha beta",
        plainText: "Hello\n\nalpha beta",
        sourceByteSize: 19,
        pdfData: null,
        renderProjectionVersion: 2,
        blocks: {
          create: [
            {
              blockKey: "heading:c1f90ed5",
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
              blockKey: "paragraph:6b744d0d",
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

  it("reuses active word lists and vocabulary highlights for clipped markdown", async () => {
    const create = vi.fn().mockResolvedValue({ id: "doc_123" });

    await createMarkdownDocument({
      ownerId: "user_123",
      title: "Observability",
      originalName: "observability.md",
      rawMarkdown: "Observability improves systems",
      sourceByteSize: 30,
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

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      data: {
        highlightMatches: {
          create: [
            {
              blockKey: expect.stringMatching(/^paragraph:[0-9a-f]{8}$/),
              startOffset: 0,
              endOffset: 13,
              term: "observability",
            },
          ],
        },
      },
    });
  });
});
