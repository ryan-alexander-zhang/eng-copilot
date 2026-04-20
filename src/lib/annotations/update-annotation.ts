import type { PrismaClient } from "@prisma/client";

type UpdateAnnotationInput = {
  annotationId: string;
  documentId: string;
  ownerId: string;
  note: string;
  prisma: Pick<PrismaClient, "annotation">;
};

export async function updateAnnotation(input: UpdateAnnotationInput) {
  const annotation = await input.prisma.annotation.findFirst({
    where: {
      id: input.annotationId,
      documentId: input.documentId,
      ownerId: input.ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!annotation) {
    throw new Error("Annotation not found");
  }

  return input.prisma.annotation.update({
    where: {
      id: annotation.id,
    },
    data: {
      note: input.note.trim(),
    },
  });
}
