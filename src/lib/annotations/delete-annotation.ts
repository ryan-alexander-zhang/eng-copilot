import type { PrismaClient } from "@prisma/client";

type DeleteAnnotationInput = {
  annotationId: string;
  documentId: string;
  ownerId: string;
  prisma: Pick<PrismaClient, "annotation">;
};

export async function deleteAnnotation(input: DeleteAnnotationInput) {
  const result = await input.prisma.annotation.deleteMany({
    where: {
      id: input.annotationId,
      documentId: input.documentId,
      ownerId: input.ownerId,
    },
  });

  if (result.count === 0) {
    throw new Error("Annotation not found");
  }
}
