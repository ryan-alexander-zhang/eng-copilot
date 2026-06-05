"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";

type AccessDeniedRecoveryActionsProps = {
  callbackUrl: string;
};

export default function AccessDeniedRecoveryActions({
  callbackUrl,
}: AccessDeniedRecoveryActionsProps) {
  const [pendingAction, setPendingAction] = useState<"sign-in" | "sign-out" | null>(null);

  return (
    <p className="text-muted mt-11 max-w-[438px] text-[15px] leading-8 tracking-[-0.02em]">
      If you are already authorized and believe this is an error, please try{" "}
      <button
        className="link-accent font-medium underline underline-offset-4 transition disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pendingAction !== null}
        onClick={() => {
          setPendingAction("sign-out");
          void Promise.resolve(signOut({ callbackUrl: "/sign-in" })).catch(() => {
            setPendingAction(null);
          });
        }}
        style={{ textDecorationColor: "rgba(249, 115, 22, 0.35)" }}
        type="button"
      >
        {pendingAction === "sign-out" ? "signing out..." : "signing out"}
      </button>{" "}
      and{" "}
      <button
        className="link-accent font-medium underline underline-offset-4 transition disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pendingAction !== null}
        onClick={() => {
          setPendingAction("sign-in");
          void Promise.resolve(
            signIn("google", {
              callbackUrl,
              prompt: "select_account",
            }),
          ).catch(() => {
            setPendingAction(null);
          });
        }}
        style={{ textDecorationColor: "rgba(249, 115, 22, 0.35)" }}
        type="button"
      >
        {pendingAction === "sign-in" ? "signing in again..." : "signing in again"}
      </button>
      .
    </p>
  );
}
