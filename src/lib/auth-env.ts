export function getAuthEnv(env: NodeJS.ProcessEnv = process.env) {
  return {
    authSecret: env.NEXTAUTH_SECRET ?? env.AUTH_SECRET,
    allowedSignInEmails: getAllowedSignInEmails(env),
    googleClientId: env.GOOGLE_CLIENT_ID ?? env.AUTH_GOOGLE_ID,
    googleClientSecret:
      env.GOOGLE_CLIENT_SECRET ?? env.AUTH_GOOGLE_SECRET,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAllowedSignInEmails(env: NodeJS.ProcessEnv = process.env) {
  const rawValue = env.ALLOWED_SIGN_IN_EMAILS?.trim();

  if (!rawValue) {
    return null;
  }

  return new Set(
    rawValue
      .split(/[\n,]/)
      .map((email) => normalizeEmail(email))
      .filter((email) => email.length > 0),
  );
}

export function isAllowedSignInEmail(
  email: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
) {
  const allowedEmails = getAllowedSignInEmails(env);

  if (!allowedEmails) {
    return true;
  }

  if (!email) {
    return false;
  }

  return allowedEmails.has(normalizeEmail(email));
}

export function assertValidAuthEnv(env: NodeJS.ProcessEnv = process.env) {
  const { authSecret, googleClientId, googleClientSecret } = getAuthEnv(env);
  const missing: string[] = [];

  if (!authSecret) {
    missing.push("NEXTAUTH_SECRET or AUTH_SECRET");
  }

  if (!googleClientId) {
    missing.push("GOOGLE_CLIENT_ID or AUTH_GOOGLE_ID");
  }

  if (!googleClientSecret) {
    missing.push("GOOGLE_CLIENT_SECRET or AUTH_GOOGLE_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing auth env: ${missing.join(", ")}`);
  }
}
