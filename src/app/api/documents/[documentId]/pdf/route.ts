import { NextResponse } from "next/server";
import { getRequiredSession, UnauthenticatedError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ documentId: string }>;
  },
) {
  try {
    const session = await getRequiredSession();
    const { documentId } = await context.params;
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId: session.user.id,
        trashedAt: null,
        sourceFormat: "PDF",
      },
      select: {
        pdfData: true,
      },
    });

    if (!document?.pdfData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new Response(document.pdfData, {
      status: 200,
      headers: {
        "cache-control": "private, no-store",
        "content-type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}
