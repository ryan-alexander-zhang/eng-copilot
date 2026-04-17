import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createDocumentFromUpload } from "@/lib/documents/create-document-from-upload";
import { UploadForm, type UploadFormState } from "@/components/documents/upload-form";

export default function NewDocumentPage() {
  async function uploadDocument(
    _state: UploadFormState,
    formData: FormData,
  ): Promise<UploadFormState> {
    "use server";

    const session = await getRequiredSession();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose a Markdown file to upload" };
    }

    try {
      await createDocumentFromUpload({
        ownerId: session.user.id,
        file,
        prisma,
      });
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }

      throw error;
    }

    redirect("/documents");
  }

  return (
    <main>
      <h1>Upload document</h1>
      <p>Add a Markdown document to your library.</p>
      <UploadForm action={uploadDocument} />
      <p>
        <Link href="/documents">Back to documents</Link>
      </p>
    </main>
  );
}
