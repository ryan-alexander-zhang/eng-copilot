import { randomBytes } from "node:crypto";
import { verifyPassword } from "@/lib/passwords";

type PasswordSignInPrisma = {
  session: {
    create: (args: {
      data: {
        expires: Date;
        sessionToken: string;
        userId: string;
      };
    }) => Promise<unknown>;
  };
  user: {
    findFirst: (args: {
      select: {
        id: true;
        passwordHash: true;
      };
      where: {
        OR: Array<
          | {
              email: string;
            }
          | {
              username: string;
            }
        >;
      };
    }) => Promise<{
      id: string;
      passwordHash: string | null;
    } | null>;
  };
};

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export async function createPasswordSignInSession({
  identifier,
  now = new Date(),
  password,
  prisma,
}: {
  identifier: string;
  now?: Date;
  password: string;
  prisma: PasswordSignInPrisma;
}) {
  const trimmedIdentifier = identifier.trim().toLowerCase();

  if (!trimmedIdentifier || !password) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          email: trimmedIdentifier,
        },
        {
          username: trimmedIdentifier,
        },
      ],
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(now.getTime() + SESSION_MAX_AGE_MS);

  await prisma.session.create({
    data: {
      expires,
      sessionToken,
      userId: user.id,
    },
  });

  return {
    expires,
    sessionToken,
  };
}
