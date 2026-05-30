import { getAllowedSignInEmails } from "@/lib/auth-env";

const HARDCODED_ADMIN_EMAILS = ["ryan.alexander.zhang@gmail.com"] as const;

export function normalizeSignInEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidSignInEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const normalizedEmail = normalizeSignInEmail(email);

  return HARDCODED_ADMIN_EMAILS.some(
    (adminEmail) => normalizeSignInEmail(adminEmail) === normalizedEmail,
  );
}

type AllowedSignInEmailPrisma = {
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
};

export async function listManagedAllowedSignInEmails(
  prisma: AllowedSignInEmailPrisma,
) {
  const records = await prisma.allowedSignInEmail?.findMany({
    orderBy: {
      email: "asc",
    },
    select: {
      email: true,
    },
  });

  return (records ?? []).map((record) => normalizeSignInEmail(record.email));
}

export async function isAllowedSignInEmailForSignIn({
  email,
  env = process.env,
  prisma,
}: {
  email: string | null | undefined;
  env?: NodeJS.ProcessEnv;
  prisma: AllowedSignInEmailPrisma;
}) {
  if (!email) {
    return false;
  }

  const normalizedEmail = normalizeSignInEmail(email);

  if (isAdminEmail(normalizedEmail)) {
    return true;
  }

  const managedEmails = await listManagedAllowedSignInEmails(prisma);

  if (managedEmails.length > 0) {
    return managedEmails.includes(normalizedEmail);
  }

  const envAllowedEmails = getAllowedSignInEmails(env);

  if (envAllowedEmails?.size) {
    return envAllowedEmails.has(normalizedEmail);
  }

  return false;
}
