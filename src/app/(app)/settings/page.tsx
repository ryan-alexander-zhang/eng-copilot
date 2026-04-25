import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRequiredSession } from "@/lib/auth";
import { hashPassword, isValidPassword, normalizeUsername, verifyPassword } from "@/lib/passwords";
import { SettingsPageShell, type SettingsTab } from "@/components/settings/settings-page-shell";

type SettingsPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    message?: string | string[];
    tab?: string | string[];
  }>;
};

function resolveValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveTab(value: string | undefined): SettingsTab {
  if (value === "security" || value === "danger-zone") {
    return value;
  }

  return "profile";
}

function buildSettingsHref(tab: SettingsTab, key: "error" | "message", value: string) {
  const params = new URLSearchParams();

  if (tab !== "profile") {
    params.set("tab", tab);
  }

  params.set(key, value);

  return `/settings?${params.toString()}`;
}

function getNotice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
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

  if (message === "session-ended") {
    return {
      message: "The selected session has been signed out.",
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

  if (error === "password-too-short") {
    return {
      message: "Use at least 8 characters for your password.",
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

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}

function formatSessionDetail(expires: Date) {
  return `Expires ${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(expires)}`;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await getRequiredSession();
  const resolvedSearchParams = await searchParams;
  const activeTab = resolveTab(resolveValue(resolvedSearchParams?.tab));
  const error = resolveValue(resolvedSearchParams?.error);
  const message = resolveValue(resolvedSearchParams?.message);
  const notice = getNotice({ error, message });

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      email: true,
      image: true,
      name: true,
      passwordHash: true,
      sessions: {
        orderBy: {
          expires: "desc",
        },
        select: {
          expires: true,
          id: true,
        },
        take: 3,
      },
      username: true,
    },
  });

  if (!user?.email) {
    redirect("/sign-in");
  }

  async function updateProfileAction(formData: FormData) {
    "use server";

    const nextUsername = normalizeUsername(String(formData.get("username") ?? ""));
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (!nextUsername) {
      redirect(buildSettingsHref("profile", "error", "invalid-username"));
    }

    try {
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          name: displayName || nextUsername,
          username: nextUsername,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        redirect(buildSettingsHref("profile", "error", "username-taken"));
      }

      throw error;
    }

    redirect(buildSettingsHref("profile", "message", "profile-saved"));
  }

  async function updatePasswordAction(formData: FormData) {
    "use server";

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!isValidPassword(newPassword)) {
      redirect(buildSettingsHref("security", "error", "password-too-short"));
    }

    if (newPassword !== confirmPassword) {
      redirect(buildSettingsHref("security", "error", "confirm-password-mismatch"));
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        passwordHash: true,
      },
    });

    if (currentUser?.passwordHash) {
      const isCurrentPasswordValid = await verifyPassword(
        currentPassword,
        currentUser.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        redirect(buildSettingsHref("security", "error", "current-password-invalid"));
      }
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        passwordHash: await hashPassword(newPassword),
      },
    });

    redirect(buildSettingsHref("security", "message", "password-updated"));
  }

  async function revokeSessionAction(formData: FormData) {
    "use server";

    const sessionId = String(formData.get("sessionId") ?? "");

    if (!sessionId) {
      redirect(buildSettingsHref("security", "message", "session-ended"));
    }

    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    redirect(buildSettingsHref("security", "message", "session-ended"));
  }

  async function deleteAllDataAction(formData: FormData) {
    "use server";

    const deleteConfirmation = String(formData.get("deleteConfirmation") ?? "").trim();

    if (deleteConfirmation !== "DELETE") {
      redirect(buildSettingsHref("danger-zone", "error", "delete-confirmation-mismatch"));
    }

    await prisma.user.delete({
      where: {
        id: session.user.id,
      },
    });

    redirect("/sign-in?message=account-deleted");
  }

  const resolvedUsername = user.username ?? normalizeUsername(user.email.split("@")[0] ?? "user");
  const resolvedDisplayName = user.name ?? resolvedUsername;
  const userLabel = user.name ?? user.email;

  return (
    <SettingsPageShell
      activeTab={activeTab}
      deleteAllDataAction={deleteAllDataAction}
      notice={notice}
      revokeSessionAction={revokeSessionAction}
      sessions={user.sessions.map((sessionRecord, index) => ({
        detail: formatSessionDetail(sessionRecord.expires),
        id: sessionRecord.id,
        isCurrent: index === 0,
        label: index === 0 ? "Current browser" : `Saved session ${index + 1}`,
      }))}
      updatePasswordAction={updatePasswordAction}
      updateProfileAction={updateProfileAction}
      user={{
        displayName: resolvedDisplayName,
        email: user.email,
        image: user.image,
        initial: getUserInitial(userLabel),
        username: resolvedUsername,
      }}
    />
  );
}
