import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { issueClipperToken } from "@/lib/clipper/tokens";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  isValidPassword,
  normalizeUsername,
  verifyPassword,
} from "@/lib/passwords";
import type { ClipperTokenActionState } from "@/components/settings/clipper-token-section";
import { UserMenuClient } from "./user-menu-client";

type AccountPanel = "api" | "clear-data" | "password" | "profile";

function buildAccountHref(
  returnTo: string,
  panel: AccountPanel,
  key: "accountError" | "accountMessage",
  value: string,
) {
  const [pathname, queryString = ""] = returnTo.split("?");
  const params = new URLSearchParams(queryString);

  params.delete("account");
  params.delete("accountError");
  params.delete("accountMessage");
  params.set("account", panel);
  params.set(key, value);

  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function getUserInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}

function resolveReturnTo(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/documents")
    .trim()
    .split("#")[0];

  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/documents";
  }

  return returnTo || "/documents";
}

export async function UserMenu({ userInitial }: { userInitial?: string }) {
  const session = await getRequiredSession();
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      clipperTokenPreview: true,
      email: true,
      image: true,
      name: true,
      passwordHash: true,
      username: true,
    },
  });

  if (!user?.email) {
    redirect("/sign-in");
  }

  async function updateProfileAction(formData: FormData) {
    "use server";

    const returnTo = resolveReturnTo(formData);
    const nextUsername = normalizeUsername(String(formData.get("username") ?? ""));
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (!nextUsername) {
      redirect(buildAccountHref(returnTo, "profile", "accountError", "invalid-username"));
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
        redirect(buildAccountHref(returnTo, "profile", "accountError", "username-taken"));
      }

      throw error;
    }

    redirect(buildAccountHref(returnTo, "profile", "accountMessage", "profile-saved"));
  }

  async function updatePasswordAction(formData: FormData) {
    "use server";

    const returnTo = resolveReturnTo(formData);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!isValidPassword(newPassword)) {
      redirect(
        buildAccountHref(returnTo, "password", "accountError", "password-policy-invalid"),
      );
    }

    if (newPassword !== confirmPassword) {
      redirect(
        buildAccountHref(returnTo, "password", "accountError", "confirm-password-mismatch"),
      );
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
        redirect(
          buildAccountHref(returnTo, "password", "accountError", "current-password-invalid"),
        );
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

    redirect(buildAccountHref(returnTo, "password", "accountMessage", "password-updated"));
  }

  async function clipperTokenAction(
    _state: ClipperTokenActionState,
    formData: FormData,
  ): Promise<ClipperTokenActionState> {
    "use server";

    const intent = String(formData.get("intent") ?? "");

    if (intent === "delete") {
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          clipperTokenCreatedAt: null,
          clipperTokenHash: null,
          clipperTokenLastUsedAt: null,
          clipperTokenPreview: null,
        },
      });

      return {
        error: null,
        hasResult: true,
        preview: null,
        token: null,
      };
    }

    if (intent !== "generate" && intent !== "rotate") {
      return {
        error: "Unable to update the API token.",
        hasResult: true,
        preview: user?.clipperTokenPreview ?? null,
        token: null,
      };
    }

    const result = await issueClipperToken({
      prisma,
      userId: session.user.id,
    });

    return {
      error: null,
      hasResult: true,
      preview: result.preview,
      token: result.token,
    };
  }

  async function deleteAllDataAction(formData: FormData) {
    "use server";

    const returnTo = resolveReturnTo(formData);
    const deleteConfirmation = String(formData.get("deleteConfirmation") ?? "").trim();

    if (deleteConfirmation !== "DELETE") {
      redirect(
        buildAccountHref(
          returnTo,
          "clear-data",
          "accountError",
          "delete-confirmation-mismatch",
        ),
      );
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
  const resolvedInitial = getUserInitial(user.name ?? user.email) || userInitial || "U";

  return (
    <UserMenuClient
      clipperTokenAction={clipperTokenAction}
      clipperTokenPreview={user.clipperTokenPreview}
      deleteAllDataAction={deleteAllDataAction}
      hasPassword={Boolean(user.passwordHash)}
      updatePasswordAction={updatePasswordAction}
      updateProfileAction={updateProfileAction}
      user={{
        displayName: resolvedDisplayName,
        email: user.email,
        image: user.image,
        initial: resolvedInitial,
        username: resolvedUsername,
      }}
    />
  );
}
