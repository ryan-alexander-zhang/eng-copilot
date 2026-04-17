import Link from "next/link";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DocumentList } from "@/components/documents/document-list";

export default async function DocumentsPage() {
  const session = await getRequiredSession();
  const documents = await prisma.document.findMany({
    where: {
      ownerId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      originalName: true,
      createdAt: true,
    },
  });

  return (
    <main>
      <h1>Documents</h1>
      <p>Your uploaded Markdown documents.</p>
      <Link href="/documents/new">Upload a document</Link>
      <DocumentList documents={documents} />
    </main>
  );
}
