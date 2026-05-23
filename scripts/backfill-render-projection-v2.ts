import { Prisma, PrismaClient } from "@prisma/client";
import { computeHighlightMatches } from "../src/lib/highlights/compute-highlight-matches";
import { getOwnerActiveTerms } from "../src/lib/highlights/get-owner-active-terms";
import { parseMarkdownToRenderProjection } from "../src/lib/markdown/parse-markdown-to-render-projection";

const prisma = new PrismaClient();
const BATCH_SIZE = 100;

type BackfillDocument = {
  id: string;
  ownerId: string;
  rawMarkdown: string;
  renderProjectionVersion: number;
  activeLists: Array<{
    wordListId: string;
  }>;
};

async function main() {
  let cursor: string | undefined;
  let processedCount = 0;

  while (true) {
    const documents = await prisma.document.findMany({
      take: BATCH_SIZE,
      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1,
          }
        : {}),
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        ownerId: true,
        rawMarkdown: true,
        renderProjectionVersion: true,
        activeLists: {
          select: {
            wordListId: true,
          },
        },
      },
    });

    if (documents.length === 0) {
      break;
    }

    for (const document of documents) {
      await backfillDocument(document);
      processedCount += 1;
      console.log(`[render-projection-v2] Backfilled ${document.id} (${processedCount})`);
    }

    cursor = documents.at(-1)?.id;
  }

  console.log(`[render-projection-v2] Completed ${processedCount} documents.`);
}

async function backfillDocument(document: BackfillDocument) {
  const blocks = parseMarkdownToRenderProjection(document.rawMarkdown);
  const { activeTerms, excludedTerms } = await getOwnerActiveTerms({
    ownerId: document.ownerId,
    selectedWordListIds: document.activeLists.map((entry) => entry.wordListId),
    prisma,
  });
  const highlightMatches = computeHighlightMatches({
    blocks,
    activeTerms,
    excludedTerms,
  });

  await prisma.$transaction(async (tx) => {
    await tx.documentBlock.deleteMany({
      where: {
        documentId: document.id,
      },
    });

    if (blocks.length > 0) {
      await tx.documentBlock.createMany({
        data: blocks.map((block) => ({
          documentId: document.id,
          blockKey: block.blockKey,
          blockPath: block.blockPath,
          sortOrder: block.sortOrder,
          kind: block.kind,
          selectable: block.selectable,
          attrs: block.attrs ?? Prisma.JsonNull,
          text: block.text,
        })),
      });
    }

    await tx.highlightMatch.deleteMany({
      where: {
        documentId: document.id,
      },
    });

    if (highlightMatches.length > 0) {
      await tx.highlightMatch.createMany({
        data: highlightMatches.map((match) => ({
          documentId: document.id,
          blockKey: match.blockKey,
          startOffset: match.startOffset,
          endOffset: match.endOffset,
          term: match.term,
        })),
      });
    }

    if (document.renderProjectionVersion !== 2) {
      await tx.document.update({
        where: {
          id: document.id,
        },
        data: {
          renderProjectionVersion: 2,
        },
      });
    }
  });
}

main()
  .catch((error) => {
    console.error("[render-projection-v2] Backfill failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
