import { redirect } from "next/navigation";
import { UploadSidebarPanel } from "@/components/layout/upload-sidebar-panel";
import type { UploadFormState } from "@/components/documents/upload-form";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DocumentUploadValidationError,
  createDocumentFromUpload,
} from "@/lib/documents/create-document-from-upload";

export function DocumentUploadSidebar() {
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

  return <UploadSidebarPanel action={uploadDocument} />;
}
