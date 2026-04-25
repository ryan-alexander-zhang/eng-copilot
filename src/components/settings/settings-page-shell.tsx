import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  CircleUserRound,
  ExternalLink,
  LockKeyhole,
  Monitor,
  Settings as SettingsIcon,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { DeleteConfirmationForm, PasswordField } from "./settings-form-controls";

export type SettingsTab = "profile" | "security" | "danger-zone";

type SessionSummary = {
  detail: string;
  id: string;
  isCurrent: boolean;
  label: string;
};

type SettingsPageShellProps = {
  activeTab: SettingsTab;
  deleteAllDataAction: (formData: FormData) => Promise<void>;
  notice?: {
    message: string;
    tone: "error" | "success";
  } | null;
  revokeSessionAction: (formData: FormData) => Promise<void>;
  sessions: SessionSummary[];
  updatePasswordAction: (formData: FormData) => Promise<void>;
  updateProfileAction: (formData: FormData) => Promise<void>;
  user: {
    displayName: string;
    email: string;
    image: string | null;
    initial: string;
    username: string;
  };
};

const settingsLinks: Array<{
  href: `/settings` | `/settings?tab=security` | `/settings?tab=danger-zone`;
  icon: typeof CircleUserRound;
  label: string;
  tab: SettingsTab;
}> = [
  {
    href: "/settings",
    icon: CircleUserRound,
    label: "Profile",
    tab: "profile",
  },
  {
    href: "/settings?tab=security",
    icon: LockKeyhole,
    label: "Security",
    tab: "security",
  },
  {
    href: "/settings?tab=danger-zone",
    icon: AlertTriangle,
    label: "Danger Zone",
    tab: "danger-zone",
  },
];

export function SettingsPageShell({
  activeTab,
  deleteAllDataAction,
  notice = null,
  revokeSessionAction,
  sessions,
  updatePasswordAction,
  updateProfileAction,
  user,
}: SettingsPageShellProps) {
  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-5 text-[#111827] sm:px-6">
      <div className="mx-auto min-h-[calc(100vh-40px)] w-full max-w-[1500px] overflow-hidden rounded-[30px] border border-[#E6EAF1] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <header className="flex h-[78px] items-center justify-between border-b border-[#EEF2F6] px-8">
          <Link className="text-[22px] font-semibold tracking-[-0.05em]" href="/documents">
            eng-copilot
          </Link>
          <div className="flex items-center gap-8 text-[15px] text-[#6B7280]">
            <Link href="/documents">Documents</Link>
            <Link href="/documents?tab=shared">Shared view</Link>
            <UserMenu userInitial={user.initial} />
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-78px)] gap-8 px-10 py-10">
          <aside className="w-full max-w-[300px] pt-2">
            <h1 className="flex items-center gap-3 text-[18px] font-semibold text-[#111827]">
              <SettingsIcon className="h-5 w-5 text-[#98A2B3]" strokeWidth={2} />
              Settings
            </h1>

            <nav className="mt-6 rounded-[22px] border border-[#E6EAF1] bg-white p-4">
              {settingsLinks.map(({ href, icon: Icon, label, tab }) => {
                const isActive = activeTab === tab;
                const isDanger = tab === "danger-zone";

                return (
                  <Link
                    key={tab}
                    className={`relative flex items-center gap-4 rounded-[16px] px-5 py-4 text-[17px] transition ${
                      isActive
                        ? isDanger
                          ? "bg-[#FFF3F3] font-medium text-[#EF4444]"
                          : "bg-[#EFF6FF] font-medium text-[#2483E2]"
                        : isDanger
                          ? "text-[#EF4444] hover:bg-[#FFF7F7]"
                          : "text-[#6B7280] hover:bg-[#F8FAFC]"
                    }`}
                    href={href}
                  >
                    {isActive ? (
                      <span
                        className={`absolute bottom-3 left-0 top-3 w-1 rounded-full ${
                          isDanger ? "bg-[#EF4444]" : "bg-[#2483E2]"
                        }`}
                      />
                    ) : null}
                    <Icon className="h-5 w-5" strokeWidth={2} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {activeTab === "danger-zone" ? (
              <div className="mt-8 rounded-[20px] border border-[#E6EAF1] bg-white p-6">
                <p className="text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">Need help?</p>
                <p className="mt-3 text-[16px] leading-8 text-[#6B7280]">
                  Visit our help center for guides and support.
                </p>
                <Link
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-[#D7DFEA] px-4 text-[15px] font-medium text-[#2483E2]"
                  href="/"
                >
                  Open help center
                  <ExternalLink className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            ) : null}
          </aside>

          <section className="min-w-0 flex-1">
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

            {activeTab === "profile" ? (
              <ProfilePanel updateProfileAction={updateProfileAction} user={user} />
            ) : null}
            {activeTab === "security" ? (
              <SecurityPanel
                revokeSessionAction={revokeSessionAction}
                sessions={sessions}
                updatePasswordAction={updatePasswordAction}
              />
            ) : null}
            {activeTab === "danger-zone" ? (
              <DangerZonePanel deleteAllDataAction={deleteAllDataAction} />
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function ProfilePanel({
  updateProfileAction,
  user,
}: Pick<SettingsPageShellProps, "updateProfileAction" | "user">) {
  return (
    <div className="space-y-5">
      <div className="px-2">
        <h2 className="text-[56px] font-semibold tracking-[-0.07em] text-[#05070B]">Profile</h2>
        <p className="mt-3 text-[18px] leading-8 text-[#6B7280]">
          Manage your personal information and how you appear on eng-copilot.
        </p>
      </div>

      <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <form action={updateProfileAction} className="space-y-8">
          <div className="border-b border-[#EEF2F6] pb-8">
            <p className="text-[16px] font-semibold text-[#111827]">Avatar</p>
            <p className="mt-1 text-[15px] text-[#6B7280]">This is your public avatar.</p>

            <div className="mt-6 flex items-center gap-5">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Avatar"
                  className="h-28 w-28 rounded-full object-cover"
                  src={user.image}
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#E9F2FF] text-[28px] font-semibold text-[#2483E2]">
                  {user.initial}
                </div>
              )}

              <div>
                <button
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#D7DFEA] px-6 text-[16px] font-medium text-[#2483E2]"
                  type="button"
                >
                  Change avatar
                </button>
                <p className="mt-3 text-[14px] text-[#9AA3B2]">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-7">
            <FieldRow
              description="Your unique handle on eng-copilot."
              id="username"
              label="Username"
            >
              <div>
                <input
                  aria-label="Username"
                  className="h-12 w-full rounded-[14px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111827] outline-none transition focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
                  defaultValue={user.username}
                  id="username"
                  name="username"
                  type="text"
                />
                <p className="mt-2 text-[14px] text-[#9AA3B2]">
                  Letters, numbers, hyphens, and underscores only.
                </p>
              </div>
            </FieldRow>

            <FieldRow
              description="The name shown to other users."
              id="displayName"
              label="Display name"
            >
              <input
                aria-label="Display name"
                className="h-12 w-full rounded-[14px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111827] outline-none transition focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
                defaultValue={user.displayName}
                id="displayName"
                name="displayName"
                type="text"
              />
            </FieldRow>

            <FieldRow
              description="Used for sign in and important notifications."
              id="email"
              label="Email"
            >
              <input
                aria-label="Email"
                className="h-12 w-full rounded-[14px] border border-[#E6EAF1] bg-[#F8FAFC] px-4 text-[16px] text-[#6B7280] outline-none"
                defaultValue={user.email}
                id="email"
                readOnly
                type="email"
              />
            </FieldRow>
          </div>

          <div className="flex justify-end border-t border-[#EEF2F6] pt-6">
            <button
              className="inline-flex h-12 min-w-[170px] items-center justify-center rounded-[12px] bg-[#2483E2] px-6 text-[18px] font-semibold text-white transition hover:bg-[#1D74CA]"
              type="submit"
            >
              Save changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SecurityPanel({
  revokeSessionAction,
  sessions,
  updatePasswordAction,
}: Pick<SettingsPageShellProps, "revokeSessionAction" | "sessions" | "updatePasswordAction">) {
  return (
    <div className="space-y-5">
      <div className="px-2">
        <h2 className="text-[56px] font-semibold tracking-[-0.07em] text-[#05070B]">Security</h2>
        <p className="mt-3 text-[18px] leading-8 text-[#6B7280]">
          Manage your password and keep your account secure.
        </p>
      </div>

      <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <form action={updatePasswordAction}>
          <p className="text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">
            Change password
          </p>
          <p className="mt-2 text-[16px] leading-7 text-[#6B7280]">
            Use a strong, unique password to protect your account.
          </p>

          <div className="mt-6 space-y-5">
            <PasswordField
              description="Leave blank if you are setting a password for the first time."
              id="currentPassword"
              label="Current password"
              name="currentPassword"
              placeholder="Enter your current password"
            />
            <PasswordField
              description="Use at least 8 characters with a mix of letters, numbers, and symbols."
              id="newPassword"
              label="New password"
              name="newPassword"
              placeholder="Enter a new password"
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              name="confirmPassword"
              placeholder="Confirm your new password"
            />
          </div>

          <button
            className="mt-7 inline-flex h-12 min-w-[170px] items-center justify-center rounded-[999px] bg-[#2483E2] px-6 text-[18px] font-semibold text-white transition hover:bg-[#1D74CA]"
            type="submit"
          >
            Update password
          </button>
        </form>
      </section>

      <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <p className="text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">
          Recent sessions
        </p>
        <p className="mt-2 text-[16px] leading-7 text-[#6B7280]">
          Review your recent activity and devices.
        </p>

        <div className="mt-6 divide-y divide-[#EEF2F6]">
          {sessions.map((session, index) => (
            <div key={session.id} className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#F5F9FF] text-[#2483E2]">
                {index % 2 === 0 ? (
                  <Monitor className="h-5 w-5" strokeWidth={2} />
                ) : (
                  <Smartphone className="h-5 w-5" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[18px] font-medium text-[#111827]">{session.label}</p>
                  {session.isCurrent ? (
                    <span className="rounded-full bg-[#E9F2FF] px-3 py-1 text-[13px] font-medium text-[#2483E2]">
                      Current session
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[15px] leading-7 text-[#8B93A3]">{session.detail}</p>
              </div>
              {!session.isCurrent ? (
                <form action={revokeSessionAction}>
                  <input name="sessionId" type="hidden" value={session.id} />
                  <button
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#D7DFEA] px-5 text-[15px] font-medium text-[#4B5563] transition hover:bg-[#F8FAFC]"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-[#EEF2F6] pt-4 text-center">
          <Link
            className="inline-flex items-center gap-2 text-[16px] font-medium text-[#2483E2]"
            href="/settings?tab=security"
          >
            View all sessions
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F9FF] text-[#2483E2]">
              <Shield className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">
                Your security matters
              </p>
              <p className="mt-2 text-[16px] leading-7 text-[#6B7280]">
                We use industry-standard encryption to keep your data safe.
              </p>
            </div>
          </div>

          <Link className="text-[16px] font-medium text-[#2483E2]" href="/">
            Learn more
          </Link>
        </div>
      </section>
    </div>
  );
}

function DangerZonePanel({
  deleteAllDataAction,
}: Pick<SettingsPageShellProps, "deleteAllDataAction">) {
  return (
    <div className="space-y-5">
      <div className="px-2">
        <h2 className="text-[72px] font-semibold leading-[0.95] tracking-[-0.07em] text-[#05070B]">
          Danger Zone
        </h2>
        <p className="mt-4 text-[18px] leading-8 text-[#6B7280]">
          These actions are permanent and cannot be undone.
        </p>
      </div>

      <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <div className="rounded-[20px] border border-[#F6B4B4] bg-[#FFF9F9] p-7">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FDE8E8] text-[#EF4444]">
                <Trash2 className="h-7 w-7" strokeWidth={2} />
              </div>
              <div className="max-w-[640px]">
                <p className="text-[24px] font-semibold tracking-[-0.04em] text-[#EF4444]">
                  Delete all data
                </p>
                <p className="mt-2 text-[16px] leading-8 text-[#6B7280]">
                  Permanently delete all of your documents, notes, annotations, and account
                  data. This action cannot be undone.
                </p>

                <div className="mt-7">
                  <p className="text-[18px] font-semibold text-[#111827]">This will permanently:</p>
                  <ul className="mt-4 space-y-4 text-[16px] leading-8 text-[#6B7280]">
                    <li className="flex items-start gap-3">
                      <span className="mt-[11px] h-2 w-2 rounded-full bg-[#EF4444]" />
                      Delete all uploaded Markdown files and content
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[11px] h-2 w-2 rounded-full bg-[#EF4444]" />
                      Remove all highlights, annotations, and notes
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[11px] h-2 w-2 rounded-full bg-[#EF4444]" />
                      Delete your account settings and preferences
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <a
              className="inline-flex h-14 min-w-[190px] items-center justify-center rounded-[12px] bg-[#EF4444] px-6 text-[18px] font-semibold text-white"
              href="#deleteConfirmation"
            >
              Delete all data
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <p className="text-[30px] font-semibold tracking-[-0.05em] text-[#111827]">
          Before you continue
        </p>
        <p className="mt-3 text-[16px] leading-8 text-[#6B7280]">
          Please confirm that you understand the consequences of this action.
        </p>

        <DeleteConfirmationForm action={deleteAllDataAction} />
      </section>

      <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F9FF] text-[#2483E2]">
              <Shield className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[28px] font-semibold tracking-[-0.04em] text-[#111827]">
                Your security matters
              </p>
              <p className="mt-2 text-[16px] leading-7 text-[#6B7280]">
                We take your data privacy seriously. Deleting your data is permanent and
                irreversible.
              </p>
            </div>
          </div>

          <Link
            className="inline-flex items-center gap-2 text-[16px] font-medium text-[#2483E2]"
            href="/"
          >
            Learn more about data deletion
            <ExternalLink className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FieldRow({
  children,
  description,
  id,
  label,
}: {
  children: ReactNode;
  description: string;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-4 border-b border-[#EEF2F6] pb-7 md:grid-cols-[320px_minmax(0,1fr)]">
      <div>
        <label className="block text-[16px] font-semibold text-[#111827]" htmlFor={id}>
          {label}
        </label>
        <p className="mt-2 text-[15px] leading-7 text-[#6B7280]">{description}</p>
      </div>
      {children}
    </div>
  );
}
