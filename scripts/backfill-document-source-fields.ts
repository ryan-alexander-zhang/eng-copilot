import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 100;

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
      where: {
        sourceFormat: "MARKDOWN",
      },
      select: {
        id: true,
        rawMarkdown: true,
        blocks: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            text: true,
          },
        },
      },
    });

    if (documents.length === 0) {
      break;
    }

    for (const document of documents) {
      const rawMarkdown = document.rawMarkdown ?? "";
      const plainText = document.blocks.map((block) => block.text).join("\n\n");
      const sourceByteSize = Buffer.byteLength(rawMarkdown, "utf8");

      await prisma.document.update({
        where: {
          id: document.id,
        },
        data: {
          plainText,
          sourceByteSize,
          pdfData: null,
          sourceFormat: "MARKDOWN",
        },
      });

      processedCount += 1;
      console.log(`[document-source-fields] Backfilled ${document.id} (${processedCount})`);
    }

    cursor = documents.at(-1)?.id;
  }

  console.log(`[document-source-fields] Completed ${processedCount} documents.`);
}

main()
  .catch((error) => {
    console.error("[document-source-fields] Backfill failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
