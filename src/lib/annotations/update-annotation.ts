import type { PrismaClient } from "@prisma/client";

type UpdateAnnotationInput = {
  annotationId: string;
  documentId: string;
  ownerId: string;
  note: string;
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
    },
  });

  if (result.count === 0) {
    throw new Error("Annotation not found");
  }

  return result;
}
