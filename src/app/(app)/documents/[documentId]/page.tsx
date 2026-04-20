import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { WordListKind } from "@prisma/client";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAnnotation } from "@/lib/annotations/create-annotation";
import { deleteAnnotation } from "@/lib/annotations/delete-annotation";
import { updateAnnotation } from "@/lib/annotations/update-annotation";
import { getOwnerDocument } from "@/lib/documents/get-owner-document";
import { recomputeDocumentHighlights } from "@/lib/highlights/recompute-document-highlights";
import { BUILT_IN_EXCLUSION_SLUG, BUILT_IN_LISTS } from "@/lib/word-lists/catalog";
import { AnnotationPanel } from "@/components/documents/annotation-panel";
import { DocumentReader } from "@/components/documents/document-reader";
import { ListToggleForm } from "@/components/documents/list-toggle-form";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const session = await getRequiredSession();
  const { documentId } = await params;
  const document = await getOwnerDocument({
    documentId,
    ownerId: session.user.id,
    prisma,
  });

  if (!document) {
    notFound();
  }

  const ownerDocumentId = document.id;
  const ownerId = session.user.id;
  const builtInPositiveLists = await prisma.wordList.findMany({
    where: {
      kind: WordListKind.POSITIVE,
      slug: {
        in: BUILT_IN_LISTS.map((list) => list.slug),
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
  const activeDocumentWordLists = await prisma.documentWordList.findMany({
    where: {
      documentId: ownerDocumentId,
    },
    select: {
      wordListId: true,
    },
  });
  const activeWordListIds = new Set(activeDocumentWordLists.map((wordList) => wordList.wordListId));
  const listOptions = BUILT_IN_LISTS.map(({ slug }) => {
    const wordList = builtInPositiveLists.find((candidate) => candidate.slug === slug);

    if (!wordList) {
      return null;
    }

    return {
      id: wordList.id,
      name: wordList.name,
      isActive: activeWordListIds.has(wordList.id),
    };
  }).filter((wordList): wordList is { id: string; name: string; isActive: boolean } => wordList !== null);

  async function createAnnotationAction(formData: FormData) {
    "use server";

    await createAnnotation({
      documentId: ownerDocumentId,
      ownerId,
      startBlockKey: getRequiredString(formData, "startBlockKey"),
      startOffset: getRequiredInteger(formData, "startOffset"),
      endBlockKey: getRequiredString(formData, "endBlockKey"),
      endOffset: getRequiredInteger(formData, "endOffset"),
      note: getOptionalString(formData, "note"),
      prisma,
    });

    revalidatePath(`/documents/${ownerDocumentId}`);
  }

  async function updateAnnotationAction(formData: FormData) {
    "use server";

    await updateAnnotation({
      annotationId: getRequiredString(formData, "annotationId"),
      documentId: ownerDocumentId,
      ownerId,
      note: getOptionalString(formData, "note"),
      prisma,
    });

    revalidatePath(`/documents/${ownerDocumentId}`);
  }

  async function deleteAnnotationAction(formData: FormData) {
    "use server";

    await deleteAnnotation({
      annotationId: getRequiredString(formData, "annotationId"),
      documentId: ownerDocumentId,
      ownerId,
      prisma,
    });

    revalidatePath(`/documents/${ownerDocumentId}`);
  }

  async function updateHighlightListsAction(formData: FormData) {
    "use server";

    const selectedWordListIds = getFormValues(formData, "wordListId");
    const ownedDocument = await prisma.document.findFirst({
      where: {
        id: ownerDocumentId,
        ownerId,
      },
      select: {
        id: true,
      },
    });

    if (!ownedDocument) {
      notFound();
    }

    const selectableBuiltInLists = await prisma.wordList.findMany({
      where: {
        kind: WordListKind.POSITIVE,
        slug: {
          in: BUILT_IN_LISTS.map((list) => list.slug),
        },
      },
      select: {
        id: true,
        entries: {
          select: {
            term: true,
          },
        },
      },
    });
    const selectableWordListIds = new Set(selectableBuiltInLists.map((wordList) => wordList.id));

    if (selectedWordListIds.some((wordListId) => !selectableWordListIds.has(wordListId))) {
      throw new Error("Invalid word list selection");
    }

    const selectedWordListIdSet = new Set(selectedWordListIds);
    const activeTerms = new Set(
      selectableBuiltInLists.flatMap((wordList) =>
        selectedWordListIdSet.has(wordList.id)
          ? wordList.entries.map((entry) => entry.term)
          : [],
      ),
    );
    const exclusionList = await prisma.wordList.findUnique({
      where: {
        slug: BUILT_IN_EXCLUSION_SLUG,
      },
      select: {
        entries: {
          select: {
            term: true,
          },
        },
      },
    });

    if (!exclusionList) {
      throw new Error("Built-in exclusion list not found");
    }

    await prisma.$transaction(async (tx) => {
      await tx.documentWordList.deleteMany({
        where: {
          documentId: ownerDocumentId,
        },
      });

      if (selectedWordListIds.length > 0) {
        await tx.documentWordList.createMany({
          data: selectedWordListIds.map((wordListId) => ({
            documentId: ownerDocumentId,
            wordListId,
          })),
          skipDuplicates: true,
        });
      }

      await recomputeDocumentHighlights({
        documentId: ownerDocumentId,
        activeTerms,
        excludedTerms: new Set(exclusionList.entries.map((entry) => entry.term)),
        prisma: tx,
      });
    });

    revalidatePath(`/documents/${ownerDocumentId}`);
  }

  return (
    <main>
      <p>
        <Link href="/documents">Back to documents</Link>
      </p>
      <h1>{document.title}</h1>
      <p>{document.originalName}</p>
      <p>
        Uploaded{" "}
        <time dateTime={document.createdAt.toISOString()}>
          {document.createdAt.toLocaleDateString()}
        </time>
      </p>
      <ListToggleForm lists={listOptions} action={updateHighlightListsAction} />
      <DocumentReader
        blocks={document.blocks}
        highlightMatches={document.highlightMatches}
        annotations={document.annotations}
      />
      <AnnotationPanel
        blocks={document.blocks.map((block) => ({
          blockKey: block.blockKey,
          text: block.text,
        }))}
        annotations={document.annotations}
        createAction={createAnnotationAction}
        updateAction={updateAnnotationAction}
        deleteAction={deleteAnnotationAction}
      />
    </main>
  );
}

function getRequiredString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${fieldName}`);
  }

  return value;
}

function getOptionalString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return "";
  }

  return value;
}

export function getRequiredInteger(formData: FormData, fieldName: string) {
  const value = getRequiredString(formData, fieldName);

  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return Number(value);
}

function getFormValues(formData: FormData, fieldName: string) {
  return formData
    .getAll(fieldName)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}
