import { notFound, redirect } from "next/navigation";
import { DocumentReader } from "@/components/documents/document-reader";
import { UnauthenticatedError, getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSharedDocument } from "@/lib/documents/get-shared-document";

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    await getRequiredSession();
  } catch (error) {
    if (!(error instanceof UnauthenticatedError)) {
      throw error;
    }

    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/shared/${token}`)}`);
  }

  let document: Awaited<ReturnType<typeof getSharedDocument>>;
  try {
    document = await getSharedDocument({
      prisma,
      token,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SHARE_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return (
    <main>
      <h1>Read-only shared view</h1>
      <h2>{document.title}</h2>
      <p>{document.originalName}</p>
      <DocumentReader
        blocks={document.blocks}
        highlightMatches={document.highlightMatches}
        annotations={document.annotations}
      />
    </main>
  );
}
