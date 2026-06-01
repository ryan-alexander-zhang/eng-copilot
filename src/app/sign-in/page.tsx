import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Info, LockKeyhole, Mail, Shield } from "lucide-react";
import AccessDeniedRecoveryActions from "./access-denied-recovery-actions";
import CredentialsSignInForm from "./credentials-sign-in-form";
import SignInButton from "./sign-in-button";
import { getBrowserExtensionLinks } from "@/lib/browser-extension-links";
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

function getAccessRequestContact() {
  const { supportUrl } = getBrowserExtensionLinks();

  if (!supportUrl) {
    return null;
  }

  const url = new URL(supportUrl);

  if (url.protocol === "mailto:") {
    const email = decodeURIComponent(url.pathname).trim();

    if (!email) {
      return null;
    }

    return {
      href: supportUrl,
      kind: "email" as const,
      label: email,
    };
  }

  return {
    href: supportUrl,
    kind: "link" as const,
    label: "Open support contact",
  };
}

function AccessDeniedHero() {
  return (
    <div className="relative mx-auto flex h-[172px] w-[172px] items-center justify-center rounded-full border border-[#F7D9D5] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.98)_0%,_rgba(255,247,246,0.9)_100%)] shadow-[0_28px_72px_rgba(228,85,77,0.08)]">
      <span className="absolute -left-7 top-[64%] h-3 w-3 rounded-full bg-[#F8D2CF]" />
      <span className="absolute right-6 top-7 text-[24px] font-semibold leading-none text-[#F5C8C4]">
        ×
      </span>
      <span className="absolute bottom-14 right-7 text-[18px] font-semibold leading-none text-[#F6D7D4]">
        ×
      </span>
      <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_30%,_rgba(255,255,255,0.98)_0%,_rgba(252,234,232,0.96)_100%)] shadow-[inset_0_-10px_24px_rgba(239,107,98,0.08),0_18px_38px_rgba(228,85,77,0.12)]">
        <Shield
          aria-hidden="true"
          className="h-[84px] w-[84px] fill-[#FCE2E0] text-[#EF6B62]"
          strokeWidth={1.8}
        />
        <LockKeyhole
          aria-hidden="true"
          className="absolute h-7 w-7 text-[#E4554D]"
          strokeWidth={2.4}
        />
      </div>
    </div>
  );
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

  if (error === "AccessDenied") {
    const accessRequestContact = getAccessRequestContact();

    return (
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-4 text-[#0F172A] sm:px-6">
        <div className="relative mx-auto min-h-[calc(100vh-32px)] w-full max-w-[608px] overflow-hidden rounded-[32px] border border-[#E7EBF2] bg-[linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(252,253,255,1)_100%)] px-6 py-10 shadow-[0_24px_90px_rgba(15,23,42,0.07)] sm:px-8 sm:py-12">
          <div className="pointer-events-none absolute inset-x-[16%] top-0 h-60 bg-[radial-gradient(circle_at_top,_rgba(74,159,216,0.06)_0%,_transparent_72%)]" />
          <div className="pointer-events-none absolute inset-x-[22%] bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,_rgba(255,241,239,0.9)_0%,_transparent_76%)]" />

          <section className="relative z-10 mx-auto flex min-h-[calc(100vh-112px)] w-full max-w-[520px] flex-col items-center justify-center py-10 text-center">
            <AccessDeniedHero />

            <h1 className="mt-11 font-[var(--font-sans)] text-[44px] font-semibold leading-[0.98] tracking-[-0.065em] text-[#0F172A] sm:text-[52px]">
              Access Denied
            </h1>
            <p className="mt-6 max-w-[468px] text-[16px] leading-8 tracking-[-0.02em] text-[#667085] sm:text-[17px]">
              Your account is not authorized to access this application.
              Please contact the administrator to request access.
            </p>

            <div className="mt-11 flex w-full flex-col gap-5">
              <section className="rounded-[18px] border border-[#D9E8FB] bg-[linear-gradient(180deg,_rgba(247,250,255,0.98)_0%,_rgba(241,246,255,0.92)_100%)] px-5 py-5 text-left shadow-[0_18px_44px_rgba(74,159,216,0.06)] sm:px-6">
                <div className="flex gap-4">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#2483E2] shadow-[inset_0_0_0_1px_rgba(36,131,226,0.1)]">
                    <Mail aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </div>
                  <div className="pt-0.5">
                    <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-[#0F172A] sm:text-[17px]">
                      Request Access
                    </h2>
                    <p className="mt-1 text-[15px] leading-7 tracking-[-0.01em] text-[#667085]">
                      {accessRequestContact?.kind === "email"
                        ? "Please send an email to request access."
                        : "Use the support contact below to request access."}
                    </p>
                    {accessRequestContact ? (
                      <a
                        className="mt-1 inline-flex text-[15px] font-medium tracking-[-0.01em] text-[#2483E2] transition hover:text-[#1768BB] hover:underline"
                        href={accessRequestContact.href}
                      >
                        {accessRequestContact.label}
                      </a>
                    ) : (
                      <p className="mt-1 text-[15px] font-medium tracking-[-0.01em] text-[#2483E2]">
                        Contact your workspace administrator.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-[18px] border border-[#E7EBF2] bg-[rgba(255,255,255,0.98)] px-5 py-5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.045)] sm:px-6">
                <div className="flex gap-4">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E6EAF1] bg-white text-[#667085]">
                    <Info aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </div>
                  <div className="pt-0.5">
                    <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-[#0F172A] sm:text-[17px]">
                      Why am I seeing this?
                    </h2>
                    <p className="mt-1 text-[15px] leading-7 tracking-[-0.01em] text-[#667085]">
                      Access to this application is restricted to authorized users only.
                    </p>
                    <p className="mt-2 text-[15px] leading-7 tracking-[-0.01em] text-[#667085]">
                      If you believe this is a mistake, please contact the administrator.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <AccessDeniedRecoveryActions callbackUrl={callbackUrl ?? "/documents"} />
          </section>
        </div>
      </main>
    );
  }

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
