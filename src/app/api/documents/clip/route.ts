import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findUserByClipperToken, touchClipperToken } from "@/lib/clipper/tokens";
import { createMarkdownDocument } from "@/lib/documents/create-markdown-document";

const MAX_MARKDOWN_BYTES = 10 * 1024 * 1024;
const CLIP_ROUTE_CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "Authorization, Content-Type",
};

type ClipDocumentRequest = {
  markdown: string;
  title: string;
  url: string;
};

class ClipDocumentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClipDocumentValidationError";
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await authenticateClipperRequest(request);
    const payload = await parseClipPayload(request);
    const title = normalizeClipTitle(payload.title, payload.url);
    const document = await createMarkdownDocument({
      ownerId,
      title,
      originalName: buildClipOriginalName(title),
      rawMarkdown: payload.markdown,
      sourceByteSize: Buffer.byteLength(payload.markdown, "utf8"),
      sourceUrl: payload.url,
      prisma,
    });

    await touchClipperToken({
      userId: ownerId,
      prisma,
    });

    return NextResponse.json(
      {
        documentId: document.id,
        documentUrl: buildDocumentUrl({
          documentId: document.id,
          request,
        }),
        title: document.title,
      },
      {
        status: 201,
        headers: CLIP_ROUTE_CORS_HEADERS,
      },
    );
  } catch (error) {
    if (error instanceof ClipperAuthenticationError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CLIP_ROUTE_CORS_HEADERS });
    }

    if (error instanceof ClipDocumentValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: CLIP_ROUTE_CORS_HEADERS },
      );
    }

    throw error;
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CLIP_ROUTE_CORS_HEADERS,
  });
}

class ClipperAuthenticationError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "ClipperAuthenticationError";
  }
}

async function authenticateClipperRequest(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new ClipperAuthenticationError();
  }

  const token = authorization.slice("Bearer ".length).trim();
  const user = await findUserByClipperToken({
    token,
    prisma,
  });

  if (!user) {
    throw new ClipperAuthenticationError();
  }

  return user.id;
}

async function parseClipPayload(request: Request): Promise<ClipDocumentRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ClipDocumentValidationError("Content-Type must be application/json");
  }

  const payload = await request.json();

  if (!isObject(payload)) {
    throw new ClipDocumentValidationError("Invalid clip payload");
  }

  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const title = typeof payload.title === "string" ? payload.title : "";
  const markdown = typeof payload.markdown === "string" ? payload.markdown : "";

  validateUrl(url);

  if (markdown.trim().length === 0) {
    throw new ClipDocumentValidationError("Markdown is required");
  }

  if (Buffer.byteLength(markdown, "utf8") > MAX_MARKDOWN_BYTES) {
    throw new ClipDocumentValidationError("Markdown must be 10 MB or smaller");
  }

  return {
    url,
    title,
    markdown,
  };
}

function normalizeClipTitle(title: string, url: string) {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");

  if (normalizedTitle.length > 0) {
    return normalizedTitle;
  }

  return new URL(url).hostname || "Clipped page";
}

function buildClipOriginalName(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "clipped-page"}.md`;
}

function validateUrl(url: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ClipDocumentValidationError("A valid http or https URL is required");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ClipDocumentValidationError("A valid http or https URL is required");
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildDocumentUrl(input: {
  documentId: string;
  request: Request;
}) {
  const requestUrl = new URL(input.request.url);
  const host = input.request.headers.get("x-forwarded-host") ?? input.request.headers.get("host");
  const protocol = input.request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(/:$/, "");
  const origin = host ? `${protocol}://${host}` : requestUrl.origin;

  return new URL(`/documents/${input.documentId}`, origin).toString();
}
