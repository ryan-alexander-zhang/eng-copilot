import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

const CLIPPER_TOKEN_PREFIX = "ecp_";

type ClipperTokenPrisma = Pick<PrismaClient, "user">;

export function generateClipperToken() {
  return `${CLIPPER_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashClipperToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildClipperTokenPreview(token: string) {
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export async function issueClipperToken(input: {
  userId: string;
  prisma: ClipperTokenPrisma;
}) {
  const token = generateClipperToken();
  const preview = buildClipperTokenPreview(token);
  const now = new Date();

  await input.prisma.user.update({
    where: {
      id: input.userId,
    },
    data: {
      clipperTokenHash: hashClipperToken(token),
      clipperTokenPreview: preview,
      clipperTokenCreatedAt: now,
      clipperTokenLastUsedAt: null,
    },
  });

  return {
    token,
    preview,
    createdAt: now,
  };
}

export async function findUserByClipperToken(input: {
  token: string;
  prisma: ClipperTokenPrisma;
}) {
  if (!input.token.startsWith(CLIPPER_TOKEN_PREFIX)) {
    return null;
  }

  return input.prisma.user.findUnique({
    where: {
      clipperTokenHash: hashClipperToken(input.token),
    },
    select: {
      id: true,
    },
  });
}

export async function touchClipperToken(input: {
  userId: string;
  prisma: ClipperTokenPrisma;
}) {
  await input.prisma.user.update({
    where: {
      id: input.userId,
    },
    data: {
      clipperTokenLastUsedAt: new Date(),
    },
  });
}
