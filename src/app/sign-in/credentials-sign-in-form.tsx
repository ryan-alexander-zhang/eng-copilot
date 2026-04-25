"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

export default function CredentialsSignInForm({
  callbackUrl,
  signInAction,
}: {
  callbackUrl: string;
  signInAction: (formData: FormData) => Promise<void>;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <form action={signInAction} className="space-y-5">
      <input name="callbackUrl" type="hidden" value={callbackUrl} />

      <div className="space-y-2">
        <label className="block text-[14px] font-medium text-[#374151]" htmlFor="identifier">
          Email or username
        </label>
        <input
          aria-label="Email or username"
          className="h-12 w-full rounded-[14px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111827] outline-none transition placeholder:text-[#B0B8C6] focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
          id="identifier"
          name="identifier"
          placeholder="you@example.com"
          type="text"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[14px] font-medium text-[#374151]" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            aria-label="Password"
            className="h-12 w-full rounded-[14px] border border-[#D8DEE8] bg-white px-4 pr-12 text-[16px] text-[#111827] outline-none transition placeholder:text-[#B0B8C6] focus:border-[#4A9FD8] focus:ring-4 focus:ring-[#4A9FD8]/10"
            id="password"
            name="password"
            placeholder="Enter your password"
            type={isPasswordVisible ? "text" : "password"}
          />
          <button
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#9AA3B2] transition hover:bg-[#F4F6FA] hover:text-[#667085]"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            type="button"
          >
            {isPasswordVisible ? (
              <EyeOff className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-[14px] text-[#6B7280]">
        <label className="inline-flex items-center gap-2">
          <input className="h-4 w-4 rounded border border-[#D5DCE6]" type="checkbox" />
          <span>Remember me</span>
        </label>
        <Link className="font-medium text-[#4A9FD8]" href="/sign-in">
          Forgot password?
        </Link>
      </div>

      <CredentialsSubmitButton />
    </form>
  );
}

function CredentialsSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-[#4A9FD8] px-5 text-[16px] font-semibold text-white transition hover:bg-[#3E90C7] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
