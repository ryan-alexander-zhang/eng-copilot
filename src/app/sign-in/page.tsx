import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import CredentialsSignInForm from "./credentials-sign-in-form";
import SignInButton from "./sign-in-button";
import { prisma } from "@/lib/db";
import { createPasswordSignInSession } from "@/lib/auth/password-sign-in";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
    message?: string | string[];
  }>;
};

function getSignInErrorMessage(error: string | undefined) {
  if (error === "OAuthSignin") {
    return "Google sign-in could not be started. Check the Google OAuth settings and the server's outbound network access, then try again.";
  }

  if (error === "CredentialsSignin") {
    return "Email, username, or password was incorrect.";
  }

  if (!error) {
    return null;
  }

  return "Sign-in failed. Try again.";
}

function getSignInMessage(message: string | undefined) {
  if (message === "account-deleted") {
    return "Your account and documents have been deleted.";
  }

  return null;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = Array.isArray(resolvedSearchParams?.callbackUrl)
    ? resolvedSearchParams.callbackUrl[0]
    : resolvedSearchParams?.callbackUrl;
  const error = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams?.error;
  const message = Array.isArray(resolvedSearchParams?.message)
    ? resolvedSearchParams.message[0]
    : resolvedSearchParams?.message;
  const errorMessage = getSignInErrorMessage(error);
  const infoMessage = getSignInMessage(message);

  async function signInWithPasswordAction(formData: FormData) {
    "use server";

    const identifier = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");
    const callbackUrlValue = String(formData.get("callbackUrl") ?? "");
    const callbackUrl =
      callbackUrlValue.startsWith("/") && !callbackUrlValue.startsWith("//")
        ? callbackUrlValue
        : "/documents";
    const session = await createPasswordSignInSession({
      identifier,
      password,
      prisma,
    });

    if (!session) {
      redirect(`/sign-in?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    const cookieStore = await cookies();
    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "";
    const forwardedProto = requestHeaders.get("x-forwarded-proto");
    const isSecureCookie =
      forwardedProto === "https" &&
      !host.startsWith("localhost") &&
      !host.startsWith("127.0.0.1");
    const cookieName = isSecureCookie
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    cookieStore.set(cookieName, session.sessionToken, {
      expires: session.expires,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: isSecureCookie,
    });

    redirect(callbackUrl);
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-5 text-[#111827] sm:px-6">
      <div className="mx-auto min-h-[calc(100vh-40px)] w-full max-w-[1500px] overflow-hidden rounded-[30px] border border-[#E6EAF1] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <header className="flex h-[78px] items-center justify-between border-b border-[#EEF2F6] px-8">
          <Link className="text-[22px] font-semibold tracking-[-0.05em]" href="/">
            eng-copilot
          </Link>
          <nav className="flex items-center gap-8 text-[15px] text-[#6B7280]">
            <Link className="font-medium text-[#4A9FD8]" href="/sign-in">
              Sign in
            </Link>
            <Link href="/documents">Documents</Link>
            <Link href="/documents?tab=shared">Shared view</Link>
            <Link href="/">Pricing</Link>
          </nav>
        </header>

        <div className="flex min-h-[calc(100vh-118px)] items-center justify-center px-6 py-12">
          <div className="w-full max-w-[500px]">
            <div className="text-center">
              <p className="text-[18px] text-[#8B93A3]">Sign in to your account</p>
              <h1 className="mt-4 text-[72px] font-semibold leading-[0.96] tracking-[-0.07em] text-[#05070B]">
                Welcome back
              </h1>
              <p className="mx-auto mt-6 max-w-[520px] text-[18px] leading-8 text-[#8B93A3]">
                Sign in to access your documents, annotations, and shared reading
                workspace.
              </p>
            </div>

            <section className="mt-12 rounded-[24px] border border-[#E6EAF1] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              {errorMessage ? (
                <p
                  role="alert"
                  className="mb-5 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {errorMessage}
                </p>
              ) : null}

              {infoMessage ? (
                <p className="mb-5 rounded-[14px] border border-[#CBE8D5] bg-[#F1FBF4] px-4 py-3 text-sm text-[#256A3D]">
                  {infoMessage}
                </p>
              ) : null}

              <CredentialsSignInForm
                callbackUrl={callbackUrl ?? "/documents"}
                signInAction={signInWithPasswordAction}
              />

              <div className="mt-8 flex items-center gap-5">
                <span className="h-px flex-1 bg-[#E6EAF1]" />
                <span className="text-[15px] text-[#6B7280]">or</span>
                <span className="h-px flex-1 bg-[#E6EAF1]" />
              </div>

              <div className="mt-8">
                <SignInButton callbackUrl={callbackUrl ?? "/documents"} />
              </div>

              <p className="mt-10 text-center text-[16px] text-[#6B7280]">
                Don&apos;t have an account?{" "}
                <Link className="font-medium text-[#4A9FD8]" href="/">
                  Create account
                </Link>
              </p>
              <p className="mt-5 text-center text-[13px] leading-6 text-[#9AA3B2]">
                By continuing, you agree to our{" "}
                <Link className="text-[#4A9FD8]" href="/">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link className="text-[#4A9FD8]" href="/">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
