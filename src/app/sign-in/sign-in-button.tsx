"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type SignInButtonProps = {
  callbackUrl: string;
};

export default function SignInButton({ callbackUrl }: SignInButtonProps) {
  const [pending, setPending] = useState(false);

  return (
    <button
      className="button-primary w-full justify-center"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void Promise.resolve(signIn("google", { callbackUrl })).catch(() => {
          setPending(false);
        });
      }}
      type="button"
    >
      {pending ? "Opening Google..." : "Continue with Google"}
    </button>
  );
}
