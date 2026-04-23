import SignInButton from "./sign-in-button";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
};

function getSignInErrorMessage(error: string | undefined) {
  if (error === "OAuthSignin") {
    return "Google sign-in could not be started. Check the Google OAuth settings and the server's outbound network access, then try again.";
  }

  if (!error) {
    return null;
  }

  return "Sign-in failed. Try again.";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = Array.isArray(resolvedSearchParams?.callbackUrl)
    ? resolvedSearchParams.callbackUrl[0]
    : resolvedSearchParams?.callbackUrl;
  const error = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams?.error;
  const errorMessage = getSignInErrorMessage(error);
  const isSharedReturn = callbackUrl?.startsWith("/shared/") ?? false;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-[520px] space-y-6">
        <header className="space-y-2.5 text-center">
          <h1 className="font-mono text-[2.25rem] font-bold tracking-[-0.045em] text-zinc-950">
            {isSharedReturn ? "Open the shared document" : "Sign in to continue"}
          </h1>
          <p className="mx-auto max-w-[32rem] text-[15px] leading-6 text-zinc-600">
            {isSharedReturn
              ? "Use Google to view the page that was shared with you."
              : "Use Google to open your reading library and pick up where you left off."}
          </p>
        </header>

        <section className="space-y-3.5 rounded-2xl border border-[color:var(--border)] bg-white/88 p-6 shadow-[0_24px_80px_rgba(17,24,39,0.08)] backdrop-blur">
          <div className="rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
              One secure sign-in
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              {isSharedReturn
                ? "After sign-in, you will go straight to the shared reading page."
                : "Your documents, notes, and shared pages stay connected to the same account."}
            </p>
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {errorMessage}
            </p>
          ) : null}

          <SignInButton callbackUrl={callbackUrl ?? "/documents"} />

          <p className="pt-0.5 text-center text-[13px] text-zinc-500">
            This workspace uses Google sign-in.
          </p>
        </section>
      </div>
    </main>
  );
}
