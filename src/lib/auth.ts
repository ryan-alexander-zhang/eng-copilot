export class UnauthenticatedError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "UnauthenticatedError";
  }
}

export async function getRequiredSession() {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    throw new UnauthenticatedError();
  }

  return session;
}
