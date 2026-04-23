import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAnnotation } from "@/lib/annotations/create-annotation";
import { deleteAnnotation } from "@/lib/annotations/delete-annotation";
import { updateAnnotation } from "@/lib/annotations/update-annotation";
import {
  countWords,
  estimateReadingMinutes,
  formatDateTimeLabel,
  formatRelativeDayLabel,
  formatStorageAmount,
} from "@/lib/documents/metrics";
import { getOwnerDocument } from "@/lib/documents/get-owner-document";
import { enableDocumentShare } from "@/lib/shares/enable-document-share";
import { revokeDocumentShare } from "@/lib/shares/revoke-document-share";
import { BUILT_IN_LISTS } from "@/lib/word-lists/catalog";
import { DocumentWorkspace } from "@/components/documents/document-workspace";
import { DocumentUploadSidebar } from "@/components/layout/document-upload-sidebar";
import { OwnerDocumentsSidebar } from "@/components/layout/owner-documents-sidebar";
import { OwnerTopBar } from "@/components/layout/owner-top-bar";

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
  const [sidebarDocuments, sidebarDocumentCount, activeWordListsWithEntries, userWordListPrefs] = await Promise.all([
    prisma.document.findMany({
      where: {
        ownerId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        rawMarkdown: true,
      },
      take: 8,
    }),
    prisma.document.count({
      where: {
        ownerId: session.user.id,
      },
    }),
    prisma.wordList.findMany({
      where: {
        id: {
          in: document.activeLists.map((entry) => entry.wordList.id),
        },
      },
      select: {
        id: true,
        name: true,
        entries: {
          select: {
            term: true,
          },
        },
      },
    }),
    prisma.userWordListPreference.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        wordList: {
          select: {
            slug: true,
          },
        },
      },
    }),
    ]);
  const storageBytes = sidebarDocuments.reduce(
    (sum, item) => sum + Buffer.byteLength(item.rawMarkdown, "utf8"),
    0,
  );
  const storageTotalBytes = 10 * 1024 * 1024 * 1024;
  const matchedWords = [...document.highlightMatches]
    .reduce<Map<string, number>>((counts, match) => {
      counts.set(match.term, (counts.get(match.term) ?? 0) + 1);
      return counts;
    }, new Map())
    .entries();
  const matchedWordItems = [...matchedWords]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([term, count]) => ({
      count,
      listName:
        activeWordListsWithEntries.find((wordList) =>
          wordList.entries.some((entry) => entry.term === term),
        )?.name ?? null,
      term,
    }));
  const userInitial = getUserInitial(session.user.name ?? session.user.email ?? "U");
  const wordCount = countWords(document.rawMarkdown);
  const readingMinutes = estimateReadingMinutes(wordCount);

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
      tags: getStringList(formData, "tags"),
      color: getOptionalString(formData, "color") || "yellow",
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
      tags: getStringList(formData, "tags"),
      color: getOptionalString(formData, "color") || "yellow",
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

  async function enableShareAction() {
    "use server";

    await enableDocumentShare({
      documentId: ownerDocumentId,
      ownerId,
      prisma,
    });

    revalidatePath(`/documents/${ownerDocumentId}`);
  }

  async function revokeShareAction() {
    "use server";

    await revokeDocumentShare({
      documentId: ownerDocumentId,
      ownerId,
      prisma,
    });

    revalidatePath(`/documents/${ownerDocumentId}`);
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto overflow-hidden rounded-[28px] border border-[#E8EBF0] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <OwnerTopBar activeTab="documents" userInitial={userInitial} />

        <div className="flex min-h-[calc(100vh-72px)]">
          <aside className="w-full max-w-[296px] border-r border-[#E8EBF0] bg-white px-6 py-6">
            <DocumentUploadSidebar />
            <div className="mt-6">
              <OwnerDocumentsSidebar
                documents={sidebarDocuments.map((item) => ({
                  id: item.id,
                  title: item.title,
                  dayLabel: formatRelativeDayLabel(item.updatedAt),
                  readingMinutes: estimateReadingMinutes(countWords(item.rawMarkdown)),
                  isActive: item.id === document.id,
                }))}
              storage={{
                  usedLabel: formatStorageAmount(storageBytes),
                  totalLabel: "10 GB",
                  progress: storageBytes / storageTotalBytes,
                }}
                totalCount={sidebarDocumentCount}
              />
            </div>
          </aside>

          <DocumentWorkspace
            annotations={document.annotations}
            blocks={document.blocks}
            createAction={createAnnotationAction}
            deleteAction={deleteAnnotationAction}
            enableShareAction={enableShareAction}
            highlightMatches={document.highlightMatches}
            matchedWords={matchedWordItems}
            readingMinutes={readingMinutes}
            revokeShareAction={revokeShareAction}
            share={document.share}
            title={document.title}
            updateAction={updateAnnotationAction}
            updatedLabel={formatDateTimeLabel(document.updatedAt)}
            wordCount={wordCount}
            wordLists={buildReaderWordLists(
              userWordListPrefs.map((preference) => preference.wordList.slug),
            )}
          />
        </div>
      </div>
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

function getStringList(formData: FormData, fieldName: string) {
  return formData
    .getAll(fieldName)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}

function buildReaderWordLists(selectedSlugs: string[]) {
  const selectedSlugSet = new Set(selectedSlugs);

  return BUILT_IN_LISTS.filter((list) =>
    ["cet4", "cet6", "ielts", "toefl"].includes(list.slug),
  ).map((list) => ({
    id: list.slug,
    name: list.name,
    isSelected: selectedSlugSet.has(list.slug),
  }));
}
