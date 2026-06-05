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
        <label className="field-label mb-3 block text-[13px] font-bold tracking-[-0.02em]" htmlFor="identifier">
          Email or username
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="text-muted pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
            strokeWidth={2}
          />
          <input
            aria-label="Email or username"
            autoComplete="username"
            className="field-input h-[50px] rounded-[16px] px-11 text-[15px] tracking-[-0.02em] placeholder:text-[var(--muted)]"
            id="identifier"
            name="identifier"
            placeholder="you@example.com"
            type="text"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="field-label mb-3 block text-[13px] font-bold tracking-[-0.02em]" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="text-muted pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
            strokeWidth={2}
          />
          <input
            aria-label="Password"
            autoComplete="current-password"
            className="field-input h-[50px] rounded-[16px] px-11 pr-12 text-[15px] tracking-[-0.02em] placeholder:text-[var(--muted)]"
            id="password"
            name="password"
            placeholder="••••••••••••••••"
            type={isPasswordVisible ? "text" : "password"}
          />
          <button
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="text-muted absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-[var(--surface-soft)] hover:text-[var(--accent)]"
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
        <label className="text-muted inline-flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap text-[13px] tracking-[-0.02em]">
          <input className="peer sr-only" defaultChecked name="remember" type="checkbox" />
          <span
            className="grid h-5 w-5 place-items-center rounded-[6px] border bg-[var(--accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] peer-not-checked:bg-[var(--surface-strong)] peer-not-checked:text-transparent"
            style={{ borderColor: "var(--border)" }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span>Remember me</span>
        </label>
        <p className="text-accent text-[13px] font-medium tracking-[-0.02em]">
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
      className="button-primary inline-flex h-12 w-full items-center justify-center rounded-[14px] px-5 text-[16px] tracking-[-0.02em] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-80"
      disabled={pending}
      type="submit"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
