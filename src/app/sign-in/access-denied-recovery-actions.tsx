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
    <p className="mt-11 max-w-[438px] text-[15px] leading-8 tracking-[-0.02em] text-[#667085]">
      If you are already authorized and believe this is an error, please try{" "}
      <button
        className="font-medium text-[#2483E2] underline decoration-[rgba(36,131,226,0.35)] underline-offset-4 transition hover:text-[#1768BB] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pendingAction !== null}
        onClick={() => {
          setPendingAction("sign-out");
          void Promise.resolve(signOut({ callbackUrl: "/sign-in" })).catch(() => {
            setPendingAction(null);
          });
        }}
        type="button"
      >
        {pendingAction === "sign-out" ? "signing out..." : "signing out"}
      </button>{" "}
      and{" "}
      <button
        className="font-medium text-[#2483E2] underline decoration-[rgba(36,131,226,0.35)] underline-offset-4 transition hover:text-[#1768BB] disabled:cursor-not-allowed disabled:opacity-70"
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
        type="button"
      >
        {pendingAction === "sign-in" ? "signing in again..." : "signing in again"}
      </button>
      .
    </p>
  );
}
