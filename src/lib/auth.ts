import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export class UnauthenticatedError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "UnauthenticatedError";
  }
}

async function getDatabaseSessionFallback() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("__Secure-authjs.session-token")?.value ??
    cookieStore.get("authjs.session-token")?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      sessionToken,
    },
    select: {
      expires: true,
      user: {
        select: {
          email: true,
          id: true,
          image: true,
          name: true,
        },
      },
    },
  });

  if (!session?.user.email || session.expires <= new Date()) {
    return null;
  }

  return {
    expires: session.expires.toISOString(),
    user: {
      email: session.user.email,
      id: session.user.id,
      image: session.user.image,
      name: session.user.name,
    },
  };
}

export async function getRequiredSession() {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (session?.user?.id && session.user.email) {
    return session;
  }

  const databaseSession = await getDatabaseSessionFallback();

  if (!databaseSession) {
    throw new UnauthenticatedError();
  }

  return databaseSession;
}
