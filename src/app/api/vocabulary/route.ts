import { NextResponse } from "next/server";
import { getRequiredSession, UnauthenticatedError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  exportVocabularyJson,
  saveVocabularyEntry,
  VocabularyValidationError,
} from "@/lib/vocabulary/service";

export async function GET() {
  try {
    const session = await getRequiredSession();
    const payload = await exportVocabularyJson({
      ownerId: session.user.id,
      prisma,
    });

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "content-disposition": "attachment; filename=\"vocabulary.json\"",
        "content-type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRequiredSession();
    const payload = await request.json();

    if (!isObject(payload)) {
      throw new VocabularyValidationError("Invalid vocabulary payload");
    }

    const entry = await saveVocabularyEntry({
      ownerId: session.user.id,
      note: typeof payload.note === "string" ? payload.note : undefined,
      word: typeof payload.word === "string" ? payload.word : "",
      wordListSlugs: Array.isArray(payload.wordListSlugs)
        ? payload.wordListSlugs.filter((slug): slug is string => typeof slug === "string")
        : [],
      source: typeof payload.source === "string" ? payload.source : undefined,
      prisma,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof VocabularyValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
