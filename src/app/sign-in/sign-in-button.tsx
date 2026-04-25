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
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] font-medium text-[#111827] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void Promise.resolve(signIn("google", { callbackUrl })).catch(() => {
          setPending(false);
        });
      }}
      type="button"
    >
      <GoogleMark />
      {pending ? "Opening Google..." : "Continue with Google"}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.805 12.23c0-.79-.064-1.365-.202-1.963H12.18v3.593h5.53c-.112.893-.714 2.238-2.052 3.142l-.019.12 2.962 2.247.205.02c1.884-1.705 2.999-4.213 2.999-7.159Z"
        fill="#4285F4"
      />
      <path
        d="M12.18 21.933c2.71 0 4.985-.874 6.647-2.385l-3.167-2.387c-.849.579-1.988.986-3.48.986-2.655 0-4.91-1.705-5.716-4.063l-.115.01-3.08 2.335-.04.108c1.651 3.221 5.04 5.396 8.951 5.396Z"
        fill="#34A853"
      />
      <path
        d="M6.464 14.084a5.938 5.938 0 0 1-.336-1.962c0-.682.122-1.343.324-1.962l-.006-.13-3.117-2.373-.102.048a9.697 9.697 0 0 0 0 8.78l3.237-2.401Z"
        fill="#FBBC05"
      />
      <path
        d="M12.18 6.096c1.885 0 3.155.8 3.88 1.47l2.832-2.697C17.156 3.285 14.89 2.31 12.18 2.31c-3.912 0-7.3 2.174-8.95 5.395l3.225 2.455c.815-2.357 3.07-4.064 5.726-4.064Z"
        fill="#EA4335"
      />
    </svg>
  );
}
