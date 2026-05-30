import { randomBytes } from "node:crypto";
import { isAllowedSignInEmailForSignIn } from "@/lib/sign-in-allowlist";
import { verifyPassword } from "@/lib/passwords";

type PasswordSignInPrisma = {
  allowedSignInEmail?: {
    findMany: (args: {
      orderBy?: {
        email: "asc" | "desc";
      };
      select: {
        email: true;
      };
    }) => Promise<Array<{ email: string }>>;
  };
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
        email: true;
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
      email: string | null;
      id: string;
      passwordHash: string | null;
    } | null>;
  };
};

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export async function createPasswordSignInSession({
  env = process.env,
  identifier,
  now = new Date(),
  password,
  prisma,
}: {
  env?: NodeJS.ProcessEnv;
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
      email: true,
      id: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  if (
    !(await isAllowedSignInEmailForSignIn({
      email: user.email,
      env,
      prisma,
    }))
  ) {
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
