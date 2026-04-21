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

  return (
    <main>
      <h1>Sign in</h1>
      <p>Continue with Google to access your documents.</p>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <SignInButton callbackUrl={callbackUrl ?? "/"} />
    </main>
  );
}
