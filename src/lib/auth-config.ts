import type { NextAuthConfig } from "next-auth";
import { ProxyAgent } from "undici";

const GOOGLE_FETCH_TIMEOUT_MS = 10_000;

type SessionCallback = NonNullable<NextAuthConfig["callbacks"]>["session"];
type SessionCallbackArgs = Parameters<NonNullable<SessionCallback>>[0];

export function getGoogleHttpOptions(env: NodeJS.ProcessEnv = process.env) {
  return {
    proxyUrl: env.HTTPS_PROXY ?? env.HTTP_PROXY ?? env.ALL_PROXY,
    timeoutMs: GOOGLE_FETCH_TIMEOUT_MS,
  };
}

export function createGoogleAuthFetch(env: NodeJS.ProcessEnv = process.env): typeof fetch {
  const { proxyUrl, timeoutMs } = getGoogleHttpOptions(env);
  const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

  return (input, init) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = init?.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;

    return fetch(input, {
      ...init,
      ...(dispatcher ? { dispatcher } : {}),
      signal,
    } as RequestInit & { dispatcher?: ProxyAgent });
  };
}

export function applySessionUserId({ session, user }: SessionCallbackArgs) {
  if (session.user) {
    session.user.id = user.id;
  }

  return session;
}
