"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Copy,
  Download,
  ExternalLink,
  Info,
  KeyRound,
  LockKeyhole,
  LogOut,
  Puzzle,
  Trash2,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { getPasswordValidationState } from "@/lib/password-rules";
import type { BrowserExtensionLinks } from "@/lib/browser-extension-links";
import {
  ClipperTokenSection,
  type ClipperTokenActionState,
} from "@/components/settings/clipper-token-section";
import { PasswordField } from "@/components/settings/settings-form-controls";

type AccountPanel =
  | "api"
  | "browser-extension"
  | "clear-data"
  | "password"
  | "profile";

type UserMenuClientProps = {
  browserExtensionLinks: BrowserExtensionLinks;
  clipperTokenAction: (
    state: ClipperTokenActionState,
    formData: FormData,
  ) => Promise<ClipperTokenActionState>;
  clipperTokenPreview: string | null;
  deleteAllDataAction: (formData: FormData) => Promise<void>;
  hasPassword: boolean;
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

type SearchParamsLike = {
  toString(): string;
};

function buildReturnTo(pathname: string, searchParams: SearchParamsLike) {
  const params = new URLSearchParams(searchParams.toString());

  params.delete("account");
  params.delete("accountError");
  params.delete("accountMessage");

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function buildUrl(
  pathname: string,
  searchParams: SearchParamsLike,
  panel: AccountPanel | null,
) {
  const params = new URLSearchParams(searchParams.toString());

  params.delete("account");
  params.delete("accountError");
  params.delete("accountMessage");

  if (panel) {
    params.set("account", panel);
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function getAccountPanel(value: string | null): AccountPanel | null {
  if (
    value === "profile" ||
    value === "password" ||
    value === "api" ||
    value === "browser-extension" ||
    value === "clear-data"
  ) {
    return value;
  }

  return null;
}

function getNotice(error: string | null, message: string | null) {
  if (message === "profile-saved") {
    return {
      message: "Your profile changes were saved.",
      tone: "success" as const,
    };
  }

  if (message === "password-updated") {
    return {
      message: "Your password has been updated.",
      tone: "success" as const,
    };
  }

  if (error === "invalid-username") {
    return {
      message: "Choose a username with letters, numbers, hyphens, or underscores.",
      tone: "error" as const,
    };
  }

  if (error === "username-taken") {
    return {
      message: "That username is already in use.",
      tone: "error" as const,
    };
  }

  if (error === "password-policy-invalid") {
    return {
      message: "Use at least 8 characters, one uppercase letter, and one number.",
      tone: "error" as const,
    };
  }

  if (error === "current-password-invalid") {
    return {
      message: "Your current password was incorrect.",
      tone: "error" as const,
    };
  }

  if (error === "confirm-password-mismatch") {
    return {
      message: "The new password and confirmation did not match.",
      tone: "error" as const,
    };
  }

  if (error === "delete-confirmation-mismatch") {
    return {
      message: "Type DELETE exactly to confirm data deletion.",
      tone: "error" as const,
    };
  }

  return null;
}

export function UserMenuClient({
  browserExtensionLinks,
  clipperTokenAction,
  clipperTokenPreview: initialClipperTokenPreview,
  deleteAllDataAction,
  hasPassword,
  updatePasswordAction,
  updateProfileAction,
  user,
}: UserMenuClientProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clipperTokenPreview, setClipperTokenPreview] = useState(initialClipperTokenPreview);
  const pathname = usePathname() ?? "/documents";
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePanel = getAccountPanel(searchParams.get("account"));
  const notice = getNotice(
    searchParams.get("accountError"),
    searchParams.get("accountMessage"),
  );
  const returnTo = buildReturnTo(pathname, searchParams);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!activePanel) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        router.replace(buildUrl(pathname, searchParams, null), {
          scroll: false,
        });
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel, pathname, router, searchParams]);

  function openPanel(panel: AccountPanel) {
    setIsMenuOpen(false);
    router.replace(buildUrl(pathname, searchParams, panel), {
      scroll: false,
    });
  }

  function closePanel() {
    router.replace(buildUrl(pathname, searchParams, null), {
      scroll: false,
    });
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={isMenuOpen}
          aria-label="Open user menu"
          className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-[#4B5563] transition hover:bg-[#F3F4F6]"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F4F6] text-[16px] font-medium text-[#374151]">
            {user.initial}
          </span>
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 top-[58px] z-30 min-w-[220px] rounded-[18px] border border-[#E5E7EB] bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
            <MenuItem
              icon={<CircleUserRound className="h-4 w-4 text-[#667085]" strokeWidth={2} />}
              label="Profile"
              onClick={() => openPanel("profile")}
            />
            <MenuItem
              icon={<LockKeyhole className="h-4 w-4 text-[#667085]" strokeWidth={2} />}
              label="Password"
              onClick={() => openPanel("password")}
            />
            <MenuItem
              icon={<KeyRound className="h-4 w-4 text-[#667085]" strokeWidth={2} />}
              label="API"
              onClick={() => openPanel("api")}
            />
            <MenuItem
              icon={<Puzzle className="h-4 w-4 text-[#667085]" strokeWidth={2} />}
              label="Browser Extension"
              onClick={() => openPanel("browser-extension")}
            />
            <MenuItem
              className="text-[#E14D45] hover:bg-[#FFF5F5]"
              icon={<Trash2 className="h-4 w-4" strokeWidth={2} />}
              label="Clear all data"
              onClick={() => openPanel("clear-data")}
            />
            <div className="my-1 border-t border-[#EEF2F6]" />
            <MenuItem
              className="text-[#E14D45] hover:bg-[#FFF5F5]"
              icon={<LogOut className="h-4 w-4" strokeWidth={2} />}
              label="Log out"
              onClick={() => {
                setIsMenuOpen(false);
                void signOut({
                  callbackUrl: "/sign-in",
                });
              }}
            />
          </div>
        ) : null}
      </div>

      {activePanel && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/28 p-4 backdrop-blur-[7px]"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closePanel();
                }
              }}
            >
              <div
                className={`w-full max-h-[calc(100vh-32px)] overflow-y-auto rounded-[34px] border border-[#E6EAF1] bg-[rgba(255,255,255,0.97)] px-8 py-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8 sm:py-7 ${
                  activePanel === "browser-extension" ? "max-w-[940px]" : "max-w-[500px]"
                }`}
              >
                <div className="flex items-start justify-between gap-6 border-b border-[#EEF2F6] pb-6">
                  <div>
                    <h2 className="text-[25px] font-semibold tracking-[-0.05em] text-[#111827]">
                      {activePanel === "profile"
                        ? "Profile"
                        : activePanel === "password"
                          ? "Password"
                          : activePanel === "api"
                            ? "API token"
                            : activePanel === "browser-extension"
                              ? "Install Browser Extension"
                            : "Clear all data"}
                    </h2>
                    <p className="mt-2 text-[16px] leading-7 text-[#8A94A6]">
                      {activePanel === "profile"
                        ? "View and update your profile information."
                        : activePanel === "password"
                          ? hasPassword
                            ? "Change your password to keep your account secure."
                            : "Set a password to sign in with your email and password."
                          : activePanel === "api"
                            ? "Generate or rotate your API token. Only one active token is allowed."
                            : activePanel === "browser-extension"
                              ? "Follow the steps below to download and install the extension."
                            : "This permanently deletes your documents, annotations, and saved account data."}
                    </p>
                  </div>

                  <button
                    aria-label="Close account panel"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E7EB] text-[#98A2B3] transition hover:bg-[#F8FAFC] hover:text-[#4B5563]"
                    onClick={closePanel}
                    type="button"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </button>
                </div>

                {activePanel === "profile" ? (
                  <ProfilePanel
                    notice={notice}
                    onClose={closePanel}
                    returnTo={returnTo}
                    updateProfileAction={updateProfileAction}
                    user={user}
                  />
                ) : null}
                {activePanel === "password" ? (
                  <PasswordPanel
                    hasPassword={hasPassword}
                    notice={notice}
                    onClose={closePanel}
                    returnTo={returnTo}
                    updatePasswordAction={updatePasswordAction}
                  />
                ) : null}
                {activePanel === "api" ? (
                  <div className="pt-6">
                    <ClipperTokenSection
                      action={clipperTokenAction}
                      onClose={closePanel}
                      onPreviewChange={setClipperTokenPreview}
                      preview={clipperTokenPreview}
                    />
                  </div>
                ) : null}
                {activePanel === "browser-extension" ? (
                  <BrowserExtensionPanel
                    downloadUrl={browserExtensionLinks.downloadUrl}
                    onClose={closePanel}
                    supportUrl={browserExtensionLinks.supportUrl}
                  />
                ) : null}
                {activePanel === "clear-data" ? (
                  <ClearDataPanel
                    deleteAllDataAction={deleteAllDataAction}
                    notice={notice}
                    onClose={closePanel}
                    returnTo={returnTo}
                  />
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MenuItem({
  className = "",
  icon,
  label,
  onClick,
}: {
  className?: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-medium text-[#374151] transition hover:bg-[#F8FAFC] ${className}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function NoticeBanner({
  notice,
}: {
  notice: {
    message: string;
    tone: "error" | "success";
  } | null;
}) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={`rounded-[18px] border px-5 py-4 text-[15px] ${
        notice.tone === "success"
          ? "border-[#CBE8D5] bg-[#F1FBF4] text-[#256A3D]"
          : "border-[#F4C7C7] bg-[#FFF5F5] text-[#B42318]"
      }`}
    >
      {notice.message}
    </div>
  );
}

function ProfilePanel({
  notice,
  onClose,
  returnTo,
  updateProfileAction,
  user,
}: {
  notice: {
    message: string;
    tone: "error" | "success";
  } | null;
  onClose: () => void;
  returnTo: string;
  updateProfileAction: (formData: FormData) => Promise<void>;
  user: UserMenuClientProps["user"];
}) {
  return (
    <form action={updateProfileAction} className="space-y-5 pt-5">
      <input name="returnTo" type="hidden" value={returnTo} />
      <NoticeBanner notice={notice} />

      <div className="space-y-2.5">
        <div>
          <p className="text-[17px] font-semibold text-[#111827]">Avatar</p>
        </div>
        <div>
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover"
              src={user.image}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EEE7FF] text-[24px] font-semibold text-[#7C5CE0]">
              {user.initial}
            </div>
          )}
        </div>
      </div>

      <ProfileField label="Email">
        <input
          aria-label="Email"
          className="h-[54px] w-full rounded-[18px] border border-[#E6EAF1] bg-[#F8FAFC] px-4 text-[16px] text-[#6B7280] outline-none"
          defaultValue={user.email}
          readOnly
          type="email"
        />
      </ProfileField>

      <ProfileField label="Username">
        <input
          aria-label="Username"
          className="h-[54px] w-full rounded-[18px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111827] outline-none transition focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
          defaultValue={user.username}
          name="username"
          type="text"
        />
      </ProfileField>

      <ProfileField label="Nickname">
        <input
          aria-label="Nickname"
          className="h-[54px] w-full rounded-[18px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111827] outline-none transition focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
          defaultValue={user.displayName}
          name="displayName"
          type="text"
        />
      </ProfileField>

      <div className="space-y-3 pt-0.5">
        <button
          className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#3FA1F4] px-6 text-[18px] font-medium text-white transition hover:bg-[#3495E7]"
          type="submit"
        >
          Save changes
        </button>
        <button
          className="inline-flex h-[52px] w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 text-[18px] font-medium text-[#111827] transition hover:bg-[#F8FAFC]"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function PasswordPanel({
  hasPassword,
  notice,
  onClose,
  returnTo,
  updatePasswordAction,
}: {
  hasPassword: boolean;
  notice: {
    message: string;
    tone: "error" | "success";
  } | null;
  onClose: () => void;
  returnTo: string;
  updatePasswordAction: (formData: FormData) => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordValidation = getPasswordValidationState(newPassword);
  const isPasswordValid =
    passwordValidation.hasMinimumLength &&
    passwordValidation.hasNumber &&
    passwordValidation.hasUppercase;
  const isSubmitEnabled =
    (!hasPassword || currentPassword.trim().length > 0) &&
    isPasswordValid && confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <form action={updatePasswordAction} className="space-y-5 pt-5">
      <input name="returnTo" type="hidden" value={returnTo} />
      <NoticeBanner notice={notice} />

      {hasPassword ? (
        <PasswordField
          autoComplete="current-password"
          description="Required to change your password."
          id="currentPassword"
          label="Current password"
          name="currentPassword"
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="Enter your current password"
          value={currentPassword}
        />
      ) : null}

      <div className="space-y-3.5">
        <PasswordField
          autoComplete="new-password"
          id="newPassword"
          label="New password"
          name="newPassword"
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Enter your new password"
          value={newPassword}
        />
        <div className="space-y-2.5 pt-0.5 text-[15px] text-[#62718C]">
          <p
            className={`flex items-center gap-3 ${
              passwordValidation.hasMinimumLength ? "text-[#62718C]" : "text-[#98A2B3]"
            }`}
          >
            <CheckCircle2
              className={`h-5 w-5 ${
                passwordValidation.hasMinimumLength ? "text-[#6AD38D]" : "text-[#D0D5DD]"
              }`}
              strokeWidth={2}
            />
            At least 8 characters
          </p>
          <p
            className={`flex items-center gap-3 ${
              passwordValidation.hasUppercase ? "text-[#62718C]" : "text-[#98A2B3]"
            }`}
          >
            <CheckCircle2
              className={`h-5 w-5 ${
                passwordValidation.hasUppercase ? "text-[#6AD38D]" : "text-[#D0D5DD]"
              }`}
              strokeWidth={2}
            />
            Includes at least one uppercase letter
          </p>
          <p
            className={`flex items-center gap-3 ${
              passwordValidation.hasNumber ? "text-[#62718C]" : "text-[#98A2B3]"
            }`}
          >
            <CheckCircle2
              className={`h-5 w-5 ${
                passwordValidation.hasNumber ? "text-[#6AD38D]" : "text-[#D0D5DD]"
              }`}
              strokeWidth={2}
            />
            Includes at least one number
          </p>
        </div>
      </div>

      <PasswordField
        autoComplete="new-password"
        id="confirmPassword"
        label="Confirm new password"
        name="confirmPassword"
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Re-enter your new password"
        value={confirmPassword}
      />

      <div className="space-y-3 pt-2">
        <button
          className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#3FA1F4] px-6 text-[18px] font-medium text-white transition hover:bg-[#3495E7] disabled:cursor-not-allowed disabled:bg-[#DCEEFF] disabled:text-[#7AA9D2]"
          disabled={!isSubmitEnabled}
          type="submit"
        >
          Save password
        </button>
        <button
          className="inline-flex h-[52px] w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 text-[18px] font-medium text-[#111827] transition hover:bg-[#F8FAFC]"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
      </div>

      <p className="flex items-center justify-center gap-2 pt-1 text-[15px] text-[#98A2B3]">
        <LockKeyhole className="h-4 w-4" strokeWidth={2} />
        Your password is encrypted and stored securely.
      </p>
    </form>
  );
}

function BrowserExtensionPanel({
  downloadUrl,
  onClose,
  supportUrl,
}: {
  downloadUrl: string | null;
  onClose: () => void;
  supportUrl: string | null;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  async function copyDownloadLink() {
    if (!downloadUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="space-y-8 pt-6">
      {!downloadUrl ? (
        <div
          className="rounded-[18px] border border-[#F4C7C7] bg-[#FFF5F5] px-5 py-4 text-[15px] text-[#B42318]"
          role="alert"
        >
          Set <code className="font-semibold">BROWSER_EXTENSION_DOWNLOAD_URL</code> to
          enable the browser extension download link.
        </div>
      ) : null}
      {copyState === "error" ? (
        <div
          className="rounded-[18px] border border-[#F4C7C7] bg-[#FFF5F5] px-5 py-4 text-[15px] text-[#B42318]"
          role="alert"
        >
          Unable to copy the extension download link.
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-[17px] font-semibold text-[#111827]">Extension download link</p>
        </div>
        <div className="rounded-[24px] border border-[#E6EAF1] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3 rounded-[18px] border border-[#D8DEE8] bg-[#FCFDFF] px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F4F7FC] text-[#667085]">
              <Puzzle className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              {downloadUrl ? (
                <a
                  className="inline-flex max-w-full items-center gap-2 overflow-hidden text-[15px] font-medium text-[#2F6FEB] hover:text-[#1D4ED8]"
                  href={downloadUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="truncate">{downloadUrl}</span>
                  <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
                </a>
              ) : (
                <p className="text-[15px] text-[#98A2B3]">Download link not configured yet.</p>
              )}
            </div>
            <button
              aria-label="Copy extension download link"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-[14px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#667085] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:text-[#B6BFCC]"
              disabled={!downloadUrl}
              onClick={() => {
                void copyDownloadLink();
              }}
              type="button"
            >
              {copyState === "copied" ? (
                "Copied"
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" strokeWidth={2} />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="mt-4 text-[15px] leading-7 text-[#8A94A6]">
            Download the packaged extension, extract it locally, and load the unpacked
            folder in Chrome developer mode.
          </p>
        </div>
      </section>

      <section className="space-y-5 border-t border-[#EEF2F6] pt-7">
        <div>
          <p className="text-[17px] font-semibold text-[#111827]">Installation guide</p>
        </div>
        <div className="space-y-6">
          <InstallationStep
            description="Click the link above to download the .zip package to your computer."
            step={1}
            title="Download the extension package"
          />
          <InstallationStep
            description="Unzip the downloaded package so you have a local folder that contains manifest.json."
            step={2}
            title="Extract the downloaded folder"
          />
          <InstallationStep
            description={
              <>
                In Chrome, type <code className="font-medium text-[#2F6FEB]">chrome://extensions</code> in the address bar and press Enter.
              </>
            }
            step={3}
            title="Open Chrome extensions page"
          />
          <InstallationStep
            content={
              <div className="mt-4 rounded-[20px] border border-[#E6EAF1] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[conic-gradient(from_210deg,#EA4335,#FBBC05,#34A853,#4285F4,#EA4335)]" />
                    <div>
                      <p className="text-[18px] font-semibold text-[#111827]">Extensions</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-full bg-[#F8FAFC] px-4 py-2.5">
                    <span className="text-[14px] font-medium text-[#475467]">Developer mode</span>
                    <span className="relative inline-flex h-7 w-12 rounded-full bg-[#2F6FEB]">
                      <span className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-start">
                  <span className="inline-flex items-center gap-2 rounded-[14px] border border-[#D8DEE8] bg-[#FCFDFF] px-4 py-2.5 text-[14px] font-medium text-[#344054]">
                    <Download className="h-4 w-4" strokeWidth={2} />
                    Load unpacked
                  </span>
                </div>
              </div>
            }
            description='Turn on the "Developer mode" toggle in the top-right corner, then click "Load unpacked".'
            step={4}
            title="Enable Developer mode"
          />
          <InstallationStep
            content={
              <div className="mt-4 rounded-[20px] border border-[#E6EAF1] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#F4F7FC] text-[#98A2B3]">
                      <Download className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <p className="truncate text-[16px] font-medium text-[#475467]">
                      eng-copilot-clipper/
                    </p>
                  </div>
                  <div className="flex items-center gap-4 rounded-[18px] bg-[#F8FAFC] px-4 py-3 text-[#667085]">
                    <span className="text-[16px]">Select folder</span>
                    <Puzzle className="h-5 w-5" strokeWidth={2} />
                  </div>
                </div>
              </div>
            }
            description="Choose the extracted extension folder. Chrome will load it immediately and the extension icon will appear in your toolbar."
            step={5}
            title="Select the unpacked folder"
          />
        </div>
      </section>

      <div className="rounded-[22px] border border-[#D8E6FF] bg-[#F5F9FF] px-5 py-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-[#2F6FEB]" strokeWidth={2} />
          <div className="text-[15px] leading-7 text-[#62718C]">
            <p className="font-semibold text-[#2F6FEB]">Need help?</p>
            {supportUrl ? (
              <p className="mt-1">
                If you encounter any issues,{" "}
                <a
                  className="font-medium text-[#2F6FEB] hover:text-[#1D4ED8]"
                  href={supportUrl}
                  rel="noreferrer"
                  target={supportUrl.startsWith("mailto:") ? undefined : "_blank"}
                >
                  Contact support
                </a>
                .
              </p>
            ) : (
              <p className="mt-1">
                If you encounter any issues, please contact your support team.
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        className="inline-flex h-14 w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 text-[18px] font-medium text-[#111827] transition hover:bg-[#F8FAFC]"
        onClick={onClose}
        type="button"
      >
        Close
      </button>
    </div>
  );
}

function InstallationStep({
  content,
  description,
  step,
  title,
}: {
  content?: ReactNode;
  description: ReactNode;
  step: number;
  title: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[56px_minmax(0,1fr)]">
      <div className="flex items-start md:justify-center">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF4FF] text-[20px] font-semibold text-[#2F6FEB]">
          {step}
        </div>
      </div>
      <div className="pb-1">
        <p className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827]">{title}</p>
        <div className="mt-2 text-[15px] leading-7 text-[#8A94A6]">{description}</div>
        {content}
      </div>
    </div>
  );
}

function ClearDataPanel({
  deleteAllDataAction,
  notice,
  onClose,
  returnTo,
}: {
  deleteAllDataAction: (formData: FormData) => Promise<void>;
  notice: {
    message: string;
    tone: "error" | "success";
  } | null;
  onClose: () => void;
  returnTo: string;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const isEnabled = confirmation.trim() === "DELETE" && isAcknowledged;

  return (
    <form action={deleteAllDataAction} className="space-y-8 pt-8">
      <input name="returnTo" type="hidden" value={returnTo} />
      <NoticeBanner notice={notice} />

      <div className="space-y-3 text-[17px] leading-8 text-[#5F6471]">
        <p>
          This will permanently delete all of your current data, including annotations,
          highlights, saved words, and saved content.
        </p>
        <p>This action cannot be undone.</p>
      </div>

      <div className="rounded-[22px] border border-[#F6B4B4] bg-[#FFF7F7] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE8E8] text-[#EF4444]">
            <AlertTriangle className="h-6 w-6" strokeWidth={2} />
          </div>
          <p className="text-[24px] font-semibold tracking-[-0.04em] text-[#EF4444]">
            This action permanently removes your data and cannot be reversed.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-[18px] font-semibold text-[#111827]" htmlFor="deleteConfirmation">
          Confirm to continue
        </label>
        <p className="mt-2 text-[16px] text-[#98A2B3]">Type DELETE to confirm</p>
        <div className="relative mt-4">
          <input
            aria-label="Delete confirmation"
            className="h-14 w-full rounded-[18px] border border-[#F3B4B4] bg-white px-4 pr-14 text-[18px] text-[#111827] outline-none transition focus:border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/10"
            id="deleteConfirmation"
            name="deleteConfirmation"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="DELETE"
            type="text"
            value={confirmation}
          />
          {confirmation.trim() === "DELETE" ? (
            <CheckCircle2
              className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#4FD38A]"
              strokeWidth={2}
            />
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-4 text-[17px] text-[#374151]">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-[10px] ${
            isAcknowledged ? "bg-[#EF4444] text-white" : "border border-[#F6B4B4] bg-white text-transparent"
          }`}
        >
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
        <input
          checked={isAcknowledged}
          className="sr-only"
          onChange={(event) => setIsAcknowledged(event.target.checked)}
          type="checkbox"
        />
        I understand this action cannot be undone.
      </label>

      <div className="space-y-3 pt-2">
        <button
          className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#EF4444] px-6 text-[18px] font-medium text-white transition hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:bg-[#F7B4B4]"
          disabled={!isEnabled}
          type="submit"
        >
          Clear all data
        </button>
        <button
          className="inline-flex h-14 w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 text-[18px] font-medium text-[#111827] transition hover:bg-[#F8FAFC]"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProfileField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[17px] font-semibold text-[#111827]">{label}</p>
      </div>
      {children}
    </div>
  );
}
