"use client";

import { signIn } from "next-auth/react";

type SignInButtonProps = {
  callbackUrl: string;
};

export default function SignInButton({ callbackUrl }: SignInButtonProps) {
  return (
    <button onClick={() => void signIn("google", { callbackUrl })}>
      Sign in with Google
    </button>
  );
}
