export function getAuthEnv(env: NodeJS.ProcessEnv = process.env) {
  return {
    authSecret: env.NEXTAUTH_SECRET ?? env.AUTH_SECRET,
    googleClientId: env.GOOGLE_CLIENT_ID ?? env.AUTH_GOOGLE_ID,
    googleClientSecret:
      env.GOOGLE_CLIENT_SECRET ?? env.AUTH_GOOGLE_SECRET,
  };
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
