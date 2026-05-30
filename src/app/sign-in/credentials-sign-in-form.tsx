"use client";

import { Check, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
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
    <form action={signInAction} className="mt-[34px]">
      <input name="callbackUrl" type="hidden" value={callbackUrl} />

      <div className="mb-5">
        <label className="mb-3 block text-[13px] font-bold tracking-[-0.02em] text-[#0F172A]" htmlFor="identifier">
          Email or username
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#98A2B3]"
            strokeWidth={2}
          />
          <input
            aria-label="Email or username"
            autoComplete="username"
            className="h-[50px] w-full rounded-[16px] border border-[#E4E7EC] bg-white px-11 text-[15px] tracking-[-0.02em] text-[#0F172A] outline-none transition placeholder:text-[#98A2B3] focus:border-[#7AB6E2] focus:shadow-[0_0_0_4px_rgba(74,159,216,0.12)]"
            id="identifier"
            name="identifier"
            placeholder="you@example.com"
            type="text"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-3 block text-[13px] font-bold tracking-[-0.02em] text-[#0F172A]" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#98A2B3]"
            strokeWidth={2}
          />
          <input
            aria-label="Password"
            autoComplete="current-password"
            className="h-[50px] w-full rounded-[16px] border border-[#E4E7EC] bg-white px-11 pr-12 text-[15px] tracking-[-0.02em] text-[#0F172A] outline-none transition placeholder:text-[#98A2B3] focus:border-[#7AB6E2] focus:shadow-[0_0_0_4px_rgba(74,159,216,0.12)]"
            id="password"
            name="password"
            placeholder="••••••••••••••••"
            type={isPasswordVisible ? "text" : "password"}
          />
          <button
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#98A2B3] transition hover:bg-[#EDF4FB] hover:text-[#4A9FD8]"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            type="button"
          >
            {isPasswordVisible ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap text-[13px] tracking-[-0.02em] text-[#667085]">
          <input className="peer sr-only" defaultChecked name="remember" type="checkbox" />
          <span className="grid h-5 w-5 place-items-center rounded-[6px] border border-[#BED8EE] bg-[#4A9FD8] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] peer-not-checked:border-[#D5DDE8] peer-not-checked:bg-white peer-not-checked:text-transparent">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span>Remember me</span>
        </label>
        <p className="text-[13px] font-medium tracking-[-0.02em] text-[#4A9FD8]">
          Need a reset? Ask your workspace admin.
        </p>
      </div>

      <CredentialsSubmitButton />
    </form>
  );
}

function CredentialsSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#58A6DE_0%,#4A9FD8_100%)] px-5 text-[16px] font-semibold tracking-[-0.02em] text-white shadow-[0_16px_30px_rgba(74,159,216,0.26)] transition hover:-translate-y-px hover:shadow-[0_20px_38px_rgba(74,159,216,0.3)] disabled:cursor-not-allowed disabled:opacity-80"
      disabled={pending}
      type="submit"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
