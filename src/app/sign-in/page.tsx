import SignInButton from "./sign-in-button";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = Array.isArray(resolvedSearchParams?.callbackUrl)
    ? resolvedSearchParams.callbackUrl[0]
    : resolvedSearchParams?.callbackUrl;

  return (
    <main>
      <h1>Sign in</h1>
      <p>Continue with Google to access your documents.</p>
      <SignInButton callbackUrl={callbackUrl ?? "/"} />
    </main>
  );
}
