import type { PrismaClient } from "@prisma/client";

type UpdateAnnotationInput = {
  annotationId: string;
  documentId: string;
  ownerId: string;
  note: string;
  tags?: string[];
  color?: string;
  prisma: Pick<PrismaClient, "annotation">;
};

export async function updateAnnotation(input: UpdateAnnotationInput) {
  const result = await input.prisma.annotation.updateMany({
    where: {
      id: input.annotationId,
      documentId: input.documentId,
      ownerId: input.ownerId,
    },
    data: {
      note: input.note.trim(),
      tags: normalizeTags(input.tags),
      color: input.color?.trim() || "yellow",
    },
  });

  if (result.count === 0) {
    throw new Error("Annotation not found");
  }

  return result;
}

function normalizeTags(tags?: string[]) {
  const uniqueTags = new Set<string>();

  for (const tag of tags ?? []) {
    const normalizedTag = tag.trim().toLowerCase();

    if (normalizedTag.length === 0) {
      continue;
    }

    uniqueTags.add(normalizedTag);
  }

  return [...uniqueTags];
}
