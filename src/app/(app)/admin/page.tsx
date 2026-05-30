import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";
import { getAllowedSignInEmails } from "@/lib/auth-env";
import { prisma } from "@/lib/db";
import {
  isAdminEmail,
  isValidSignInEmail,
  listManagedAllowedSignInEmails,
  normalizeSignInEmail,
} from "@/lib/sign-in-allowlist";

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function resolveValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildAdminHref(key: "error" | "message", value: string) {
  const params = new URLSearchParams();
  params.set(key, value);

  return `/admin?${params.toString()}`;
}

function getNotice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (message === "email-added") {
    return {
      message: "The email was added to the allowlist.",
      tone: "success" as const,
    };
  }

  if (message === "email-removed") {
    return {
      message: "The email was removed from the allowlist.",
      tone: "success" as const,
    };
  }

  if (error === "invalid-email") {
    return {
      message: "Enter a valid email address.",
      tone: "error" as const,
    };
  }

  if (error === "duplicate-email") {
    return {
      message: "That email is already on the allowlist.",
      tone: "error" as const,
    };
  }

  return null;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getRequiredSession();

  if (!isAdminEmail(session.user.email)) {
    redirect("/documents");
  }

  const resolvedSearchParams = await searchParams;
  const notice = getNotice({
    error: resolveValue(resolvedSearchParams?.error),
    message: resolveValue(resolvedSearchParams?.message),
  });

  const [managedEmails, user] = await Promise.all([
    listManagedAllowedSignInEmails(prisma),
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
        name: true,
      },
    }),
  ]);
  const envAllowedEmails = getAllowedSignInEmails();
  const envEmails = envAllowedEmails ? Array.from(envAllowedEmails).sort() : [];

  async function addAllowedEmailAction(formData: FormData) {
    "use server";

    const nextEmail = normalizeSignInEmail(String(formData.get("email") ?? ""));

    if (!nextEmail || !isValidSignInEmail(nextEmail)) {
      redirect(buildAdminHref("error", "invalid-email"));
    }

    try {
      await prisma.allowedSignInEmail.create({
        data: {
          email: nextEmail,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        redirect(buildAdminHref("error", "duplicate-email"));
      }

      throw error;
    }

    redirect(buildAdminHref("message", "email-added"));
  }

  async function removeAllowedEmailAction(formData: FormData) {
    "use server";

    const email = normalizeSignInEmail(String(formData.get("email") ?? ""));

    if (!email) {
      redirect(buildAdminHref("message", "email-removed"));
    }

    await prisma.allowedSignInEmail.deleteMany({
      where: {
        email,
      },
    });

    redirect(buildAdminHref("message", "email-removed"));
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-5 text-[#111827] sm:px-6">
      <div className="mx-auto min-h-[calc(100vh-40px)] w-full max-w-[1500px] overflow-hidden rounded-[30px] border border-[#E6EAF1] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <header className="flex h-[78px] items-center justify-between border-b border-[#EEF2F6] px-8">
          <Link className="text-[22px] font-semibold tracking-[-0.05em]" href="/documents">
            eng-copilot
          </Link>
          <div className="flex items-center gap-8 text-[15px] text-[#6B7280]">
            <Link href="/documents">Documents</Link>
            <Link className="font-medium text-[#2483E2]" href="/admin">
              Admin
            </Link>
            <Link href="/settings">Settings</Link>
          </div>
        </header>

        <div className="px-10 py-10">
          <div className="max-w-[900px]">
            <p className="text-[16px] font-medium uppercase tracking-[0.18em] text-[#2483E2]">
              Admin
            </p>
            <h1 className="mt-4 text-[56px] font-semibold tracking-[-0.07em] text-[#05070B]">
              Email authorization
            </h1>
            <p className="mt-3 text-[18px] leading-8 text-[#6B7280]">
              Control which email addresses can access eng-copilot. The hardcoded admin
              account always remains allowed.
            </p>

            <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                {notice ? (
                  <div
                    className={`mb-5 rounded-[18px] border px-5 py-4 text-[15px] ${
                      notice.tone === "success"
                        ? "border-[#CBE8D5] bg-[#F1FBF4] text-[#256A3D]"
                        : "border-[#F4C7C7] bg-[#FFF5F5] text-[#B42318]"
                    }`}
                  >
                    {notice.message}
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-4 border-b border-[#EEF2F6] pb-5">
                  <div>
                    <p className="text-[24px] font-semibold tracking-[-0.04em] text-[#111827]">
                      Managed allowlist
                    </p>
                    <p className="mt-2 text-[15px] text-[#6B7280]">
                      Add or remove email addresses that are allowed to sign in.
                    </p>
                  </div>
                  <div className="rounded-full bg-[#EFF6FF] px-4 py-2 text-[14px] font-medium text-[#2483E2]">
                    {managedEmails.length} authorized
                  </div>
                </div>

                <form action={addAllowedEmailAction} className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <input
                    aria-label="Allowed email"
                    className="h-12 min-w-0 flex-1 rounded-[14px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111827] outline-none transition focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                  />
                  <button
                    className="inline-flex h-12 items-center justify-center rounded-[14px] bg-[#2483E2] px-6 text-[16px] font-semibold text-white transition hover:bg-[#1D74CA]"
                    type="submit"
                  >
                    Add email
                  </button>
                </form>

                <div className="mt-8 overflow-hidden rounded-[20px] border border-[#E6EAF1]">
                  {managedEmails.length > 0 ? (
                    <ul className="divide-y divide-[#EEF2F6]">
                      {managedEmails.map((email) => (
                        <li
                          key={email}
                          className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-[16px] font-medium text-[#111827]">{email}</p>
                            <p className="mt-1 text-[14px] text-[#8B93A3]">
                              Managed in the application allowlist.
                            </p>
                          </div>
                          <form action={removeAllowedEmailAction}>
                            <input name="email" type="hidden" value={email} />
                            <button
                              className="inline-flex h-10 items-center justify-center rounded-full border border-[#F3C9C9] px-4 text-[14px] font-medium text-[#B42318] transition hover:bg-[#FFF5F5]"
                              type="submit"
                            >
                              Remove
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-5 py-8 text-[15px] text-[#6B7280]">
                      No managed emails yet.
                    </div>
                  )}
                </div>
              </section>

              <div className="space-y-5">
                <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">
                    Access mode
                  </p>
                  {managedEmails.length > 0 ? (
                    <p className="mt-3 text-[15px] leading-7 text-[#6B7280]">
                      Authorization is enforced from the managed allowlist above.
                    </p>
                  ) : envEmails.length > 0 ? (
                    <p className="mt-3 text-[15px] leading-7 text-[#6B7280]">
                      No managed allowlist entries yet. Sign-in currently falls back to the
                      environment allowlist until you add the first email here.
                    </p>
                  ) : (
                    <p className="mt-3 text-[15px] leading-7 text-[#6B7280]">
                      No allowlist is configured yet. Right now, any email can sign in until
                      you add the first managed entry.
                    </p>
                  )}
                </section>

                <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">
                    Hardcoded admin
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-[#111827]">
                    {user?.email ?? session.user.email}
                  </p>
                  <p className="mt-2 text-[15px] leading-7 text-[#6B7280]">
                    This account can always reach /admin and sign in, even if it is not in the
                    managed allowlist.
                  </p>
                </section>

                {envEmails.length > 0 ? (
                  <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                    <p className="text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">
                      Environment fallback
                    </p>
                    <p className="mt-3 text-[15px] leading-7 text-[#6B7280]">
                      These entries are only used while the managed allowlist is empty.
                    </p>
                    <ul className="mt-4 space-y-2 text-[15px] text-[#111827]">
                      {envEmails.map((email) => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
