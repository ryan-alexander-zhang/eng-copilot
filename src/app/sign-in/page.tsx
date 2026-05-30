import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import CredentialsSignInForm from "./credentials-sign-in-form";
import SignInButton from "./sign-in-button";
import { UnauthenticatedError, getRequiredSession } from "@/lib/auth";
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

  if (error === "AccessDenied") {
    return "This email address is not allowed to sign in.";
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
  try {
    await getRequiredSession();
    redirect("/documents");
  } catch (error) {
    if (!(error instanceof UnauthenticatedError)) {
      throw error;
    }
  }

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
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-4 text-[#0F172A] sm:px-6">
      <div
        className="relative mx-auto grid min-h-[calc(100vh-32px)] w-full max-w-[1000px] place-items-center overflow-hidden rounded-[32px] px-4 py-8 sm:px-6 sm:py-10"
        style={{
          background:
            "radial-gradient(circle at 50% 22%, rgba(74,159,216,0.08) 0, transparent 34%), linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,247,251,1) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -left-24 bottom-10 h-60 w-60 rounded-full bg-[#E9F2FB] opacity-90" />
        <div className="pointer-events-none absolute right-14 top-10 h-36 w-36 rounded-full bg-[#F1F5FB] opacity-80" />

        <section
          aria-labelledby="signin-title"
          className="relative z-10 w-full max-w-[430px] rounded-[28px] border border-[#E7EBF2] bg-[rgba(255,255,255,0.94)] px-5 py-8 shadow-[0_40px_100px_rgba(74,159,216,0.12)] sm:px-[34px] sm:py-[42px]"
        >
          <Link
            className="mb-8 inline-block font-[var(--font-display)] text-[26px] font-bold tracking-[-0.06em] text-[#0F172A]"
            href="/"
          >
            eng-copilot
          </Link>

          <h1
            className="text-[31px] font-semibold leading-[1.06] tracking-[-0.05em] text-[#0F172A]"
            id="signin-title"
          >
            Welcome back
          </h1>
          <p className="mt-3 text-[15px] leading-6 tracking-[-0.02em] text-[#667085]">
            Sign in to continue to your workspace.
          </p>

          {errorMessage ? (
            <p
              role="alert"
              className="mt-6 rounded-[14px] bg-[#FFF4E8] px-4 py-3 text-[13px] leading-5 text-[#7C4A12]"
            >
              {errorMessage}
            </p>
          ) : null}

          {infoMessage ? (
            <p className="mt-6 rounded-[14px] bg-[#ECFDF3] px-4 py-3 text-[13px] leading-5 text-[#166534]">
              {infoMessage}
            </p>
          ) : null}

          <CredentialsSignInForm
            callbackUrl={callbackUrl ?? "/documents"}
            signInAction={signInWithPasswordAction}
          />

          <div className="mt-[22px] grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[13px] text-[#98A2B3]">
            <span className="h-px bg-[#E6EAF1]" />
            <span>or</span>
            <span className="h-px bg-[#E6EAF1]" />
          </div>

          <div className="mt-[22px]">
            <SignInButton callbackUrl={callbackUrl ?? "/documents"} />
          </div>

          <p className="mt-7 text-center text-[15px] leading-6 tracking-[-0.02em] text-[#667085]">
            Need access? Contact your workspace admin.
          </p>
        </section>
      </div>
    </main>
  );
}
