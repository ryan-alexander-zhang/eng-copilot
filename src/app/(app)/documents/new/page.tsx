import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DocumentUploadValidationError,
  createDocumentFromUpload,
} from "@/lib/documents/create-document-from-upload";
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
      const document = await createDocumentFromUpload({
        ownerId: session.user.id,
        file,
        prisma,
      });

      redirect(`/documents/${document.id}`);
    } catch (error) {
      if (error instanceof DocumentUploadValidationError) {
        return { error: error.message };
      }

      throw error;
    }
  }

  return (
    <main className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <section>
        <Link
          className="inline-flex text-sm font-medium text-zinc-600 underline-offset-4 hover:underline"
          href="/documents"
        >
          Back to library
        </Link>
        <span className="eyebrow mt-6">New document</span>
        <h1 className="display-copy mt-5 text-5xl font-semibold leading-[0.96] text-zinc-950">
          Add a document
        </h1>
        <p className="mt-4 max-w-xl text-base leading-8 text-zinc-600">
          Bring in one Markdown file. We&apos;ll turn it into a clear reading view you can
          highlight, annotate, and share.
        </p>
        <div className="surface-card-muted mt-6 space-y-3">
          <p className="text-sm font-semibold text-zinc-900">What happens next</p>
          <ul className="space-y-2 text-sm leading-7 text-zinc-600">
            <li>Review vocabulary highlights in the reading view.</li>
            <li>Save notes beside the exact passage you selected.</li>
            <li>Share a view-only page when someone else needs the same context.</li>
          </ul>
        </div>
      </section>

      <section className="surface-card">
        <UploadForm action={uploadDocument} />
      </section>
    </main>
  );
}
