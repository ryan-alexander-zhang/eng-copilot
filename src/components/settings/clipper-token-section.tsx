"use client";

import { useActionState, useState } from "react";

export type ClipperTokenActionState = {
  error: string | null;
  preview: string | null;
  token: string | null;
};

const initialState: ClipperTokenActionState = {
  error: null,
  preview: null,
  token: null,
};

export function ClipperTokenSection({
  action,
  preview,
}: {
  action: (
    state: ClipperTokenActionState,
    formData: FormData,
  ) => Promise<ClipperTokenActionState>;
  preview: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {
    ...initialState,
    preview,
  });
  const [copyLabel, setCopyLabel] = useState("Copy token");
  const activePreview = state.preview ?? preview;
  const isConfigured = Boolean(activePreview);

  async function copyToken() {
    if (!state.token) {
      return;
    }

    await navigator.clipboard.writeText(state.token);
    setCopyLabel("Copied");
    window.setTimeout(() => {
      setCopyLabel("Copy token");
    }, 1600);
  }

  return (
    <section className="rounded-[24px] border border-[#E6EAF1] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">
            Web Clipper
          </p>
          <p className="mt-2 max-w-[640px] text-[16px] leading-7 text-[#6B7280]">
            Generate a token for the Chrome clipper extension. The token is shown once after
            generation and can be rotated at any time. Use the exact same app origin you sign
            into. For local development, prefer <code>http://localhost:3000</code> and do not mix
            it with <code>http://127.0.0.1:3000</code>.
          </p>
        </div>

        <form action={formAction}>
          <input name="intent" type="hidden" value={isConfigured ? "rotate" : "generate"} />
          <button
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[#2483E2] px-5 text-[15px] font-semibold text-white transition hover:bg-[#1D74CA] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={pending}
            type="submit"
          >
            {pending ? "Working..." : isConfigured ? "Rotate token" : "Generate token"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-[18px] border border-[#E6EAF1] bg-[#F8FAFC] px-5 py-4">
        <p className="text-[14px] font-medium text-[#111827]">Current status</p>
        <p className="mt-2 text-[15px] text-[#6B7280]">
          {activePreview ? `Configured: ${activePreview}` : "No clipper token configured yet."}
        </p>
      </div>

      {state.token ? (
        <div className="mt-5 rounded-[18px] border border-[#CBE8D5] bg-[#F1FBF4] p-5">
          <p className="text-[15px] font-semibold text-[#256A3D]">Copy this token now</p>
          <p className="mt-2 text-[14px] leading-6 text-[#256A3D]">
            This is the only time the full token will be shown.
          </p>
          <code className="mt-4 block overflow-x-auto rounded-[14px] bg-white px-4 py-3 text-[13px] text-[#111827]">
            {state.token}
          </code>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-[12px] border border-[#B7DEC4] bg-white px-4 text-[14px] font-medium text-[#256A3D]"
            onClick={copyToken}
            type="button"
          >
            {copyLabel}
          </button>
        </div>
      ) : null}

      {state.error ? (
        <p
          className="mt-5 rounded-[18px] border border-[#F4C7C7] bg-[#FFF5F5] px-5 py-4 text-[15px] text-[#B42318]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
    </section>
  );
}
