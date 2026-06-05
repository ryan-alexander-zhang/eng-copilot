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
    <div
      className="relative mx-auto flex h-[172px] w-[172px] items-center justify-center rounded-full border"
      style={{
        borderColor: "var(--warning-border)",
        background:
          "radial-gradient(circle at center, rgba(255,255,255,0.98) 0%, rgba(255,244,232,0.92) 100%)",
        boxShadow: "0 28px 72px rgba(160, 81, 22, 0.1)",
      }}
    >
      <span
        className="absolute -left-7 top-[64%] h-3 w-3 rounded-full"
        style={{ backgroundColor: "rgba(249, 115, 22, 0.14)" }}
      />
      <span
        className="absolute right-6 top-7 text-[24px] font-semibold leading-none"
        style={{ color: "rgba(171, 77, 18, 0.18)" }}
      >
        ×
      </span>
      <span
        className="absolute bottom-14 right-7 text-[18px] font-semibold leading-none"
        style={{ color: "rgba(171, 77, 18, 0.14)" }}
      >
        ×
      </span>
      <div
        className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.98) 0%, rgba(255,240,223,0.96) 100%)",
          boxShadow:
            "inset 0 -10px 24px rgba(249, 115, 22, 0.08), 0 18px 38px rgba(160, 81, 22, 0.16)",
        }}
      >
        <Shield
          aria-hidden="true"
          className="h-[84px] w-[84px]"
          strokeWidth={1.8}
          style={{
            color: "var(--accent)",
            fill: "var(--accent-soft)",
          }}
        />
        <LockKeyhole
          aria-hidden="true"
          className="absolute h-7 w-7"
          strokeWidth={2.4}
          style={{ color: "var(--accent-strong)" }}
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
      <main className="app-shell px-4 py-4 sm:px-6">
        <div
          className="app-frame relative min-h-[calc(100vh-32px)] w-full max-w-[608px] px-6 py-10 sm:px-8 sm:py-12"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,250,244,1) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-[16%] top-0 h-60"
            style={{
              background:
                "radial-gradient(circle at top, rgba(249, 115, 22, 0.08) 0%, transparent 72%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-[22%] bottom-0 h-64"
            style={{
              background:
                "radial-gradient(circle at bottom, rgba(255, 240, 223, 0.92) 0%, transparent 76%)",
            }}
          />

          <section className="relative z-10 mx-auto flex min-h-[calc(100vh-112px)] w-full max-w-[520px] flex-col items-center justify-center py-10 text-center">
            <AccessDeniedHero />

            <h1 className="mt-11 font-[var(--font-sans)] text-[44px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-[52px]">
              Access Denied
            </h1>
            <p className="text-muted mt-6 max-w-[468px] text-[16px] leading-8 tracking-[-0.02em] sm:text-[17px]">
              Your account is not authorized to access this application.
              Please contact the administrator to request access.
            </p>

            <div className="mt-11 flex w-full flex-col gap-5">
              <section className="panel-card-accent text-left sm:px-6">
                <div className="flex gap-4">
                  <div className="text-accent mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] shadow-[inset_0_0_0_1px_rgba(249,115,22,0.12)]">
                    <Mail aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </div>
                  <div className="pt-0.5">
                    <h2 className="text-[16px] font-semibold tracking-[-0.03em] sm:text-[17px]">
                      Request Access
                    </h2>
                    <p className="text-muted mt-1 text-[15px] leading-7 tracking-[-0.01em]">
                      {accessRequestContact?.kind === "email"
                        ? "Please send an email to request access."
                        : "Use the support contact below to request access."}
                    </p>
                    {accessRequestContact ? (
                      <a
                        className="link-accent mt-1 inline-flex text-[15px] font-medium tracking-[-0.01em] transition hover:underline"
                        href={accessRequestContact.href}
                      >
                        {accessRequestContact.label}
                      </a>
                    ) : (
                      <p className="text-accent mt-1 text-[15px] font-medium tracking-[-0.01em]">
                        Contact your workspace administrator.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="panel-card text-left sm:px-6">
                <div className="flex gap-4">
                  <div
                    className="text-muted mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-[var(--surface-strong)]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Info aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </div>
                  <div className="pt-0.5">
                    <h2 className="text-[16px] font-semibold tracking-[-0.03em] sm:text-[17px]">
                      Why am I seeing this?
                    </h2>
                    <p className="text-muted mt-1 text-[15px] leading-7 tracking-[-0.01em]">
                      Access to this application is restricted to authorized users only.
                    </p>
                    <p className="text-muted mt-2 text-[15px] leading-7 tracking-[-0.01em]">
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
    <main className="app-shell px-4 py-4 sm:px-6">
      <div
        className="app-frame relative grid min-h-[calc(100vh-32px)] w-full max-w-[1000px] place-items-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10"
        style={{
          background:
            "radial-gradient(circle at 50% 22%, rgba(249,115,22,0.08) 0%, transparent 34%), linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,249,241,1) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -left-24 bottom-10 h-60 w-60 rounded-full opacity-90"
          style={{ backgroundColor: "rgba(255, 240, 223, 0.96)" }}
        />
        <div
          className="pointer-events-none absolute right-14 top-10 h-36 w-36 rounded-full opacity-80"
          style={{ backgroundColor: "rgba(255, 246, 235, 0.92)" }}
        />

        <section
          aria-labelledby="signin-title"
          className="relative z-10 w-full max-w-[430px] rounded-[28px] border bg-[rgba(255,255,255,0.94)] px-5 py-8 sm:px-[34px] sm:py-[42px]"
          style={{
            borderColor: "var(--border)",
            boxShadow: "0 40px 100px rgba(97, 52, 18, 0.1)",
          }}
        >
          <Link
            className="mb-8 inline-block font-[var(--font-display)] text-[26px] font-bold tracking-[-0.06em]"
            href="/"
          >
            eng-copilot
          </Link>

          <h1
            className="text-[31px] font-semibold leading-[1.06] tracking-[-0.05em]"
            id="signin-title"
          >
            Welcome back
          </h1>
          <p className="text-muted mt-3 text-[15px] leading-6 tracking-[-0.02em]">
            Sign in to continue to your workspace.
          </p>

          {errorMessage ? (
            <p
              className="mt-6 rounded-[14px] px-4 py-3 text-[13px] leading-5"
              role="alert"
              style={{
                backgroundColor: "var(--warning-bg)",
                color: "var(--warning-foreground)",
              }}
            >
              {errorMessage}
            </p>
          ) : null}

          {infoMessage ? (
            <p
              className="mt-6 rounded-[14px] px-4 py-3 text-[13px] leading-5"
              style={{
                backgroundColor: "var(--success-bg)",
                color: "var(--success-foreground)",
              }}
            >
              {infoMessage}
            </p>
          ) : null}

          <CredentialsSignInForm
            callbackUrl={callbackUrl ?? "/documents"}
            signInAction={signInWithPasswordAction}
          />

          <div className="text-muted mt-[22px] grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[13px]">
            <span className="divider h-px" />
            <span>or</span>
            <span className="divider h-px" />
          </div>

          <div className="mt-[22px]">
            <SignInButton callbackUrl={callbackUrl ?? "/documents"} />
          </div>

          <p className="text-muted mt-7 text-center text-[15px] leading-6 tracking-[-0.02em]">
            Need access? Contact your workspace admin.
          </p>
        </section>
      </div>
    </main>
  );
}
