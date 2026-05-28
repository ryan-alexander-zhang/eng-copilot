import { NextResponse } from "next/server";
import { getRequiredSession, UnauthenticatedError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ token: string }>;
  },
) {
  try {
    await getRequiredSession();
    const { token } = await context.params;
    const share = await prisma.documentShare.findUnique({
      where: {
        token,
      },
      select: {
        isActive: true,
        document: {
          select: {
            trashedAt: true,
            sourceFormat: true,
            pdfData: true,
          },
        },
      },
    });

    if (
      !share?.isActive ||
      share.document.trashedAt ||
      share.document.sourceFormat !== "PDF" ||
      !share.document.pdfData
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new Response(share.document.pdfData, {
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
