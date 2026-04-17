"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <p>Continue with Google to access your documents.</p>
      <button onClick={() => void signIn("google", { callbackUrl: "/" })}>
        Sign in with Google
      </button>
    </main>
  );
}
