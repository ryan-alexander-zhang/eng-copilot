"use client";

import { CheckCircle2, Copy, Info, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

export type ClipperTokenActionState = {
  error: string | null;
  hasResult: boolean;
  preview: string | null;
  token: string | null;
};

const initialState: ClipperTokenActionState = {
  error: null,
  hasResult: false,
  preview: null,
  token: null,
};

type ToastState = {
  kind: "error" | "success";
  message: string;
};

export function ClipperTokenSection({
  action,
  onClose,
  onPreviewChange,
  preview,
}: {
  action: (
    state: ClipperTokenActionState,
    formData: FormData,
  ) => Promise<ClipperTokenActionState>;
  onClose?: () => void;
  onPreviewChange?: (preview: string | null) => void;
  preview: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {
    ...initialState,
    preview,
  });
  const [toast, setToast] = useState<ToastState | null>(null);
  const activePreview = state.hasResult ? state.preview : preview;
  const isConfigured = Boolean(activePreview);
  const displayToken = state.token ?? activePreview;
  const canCopyToken = Boolean(state.token);

  useEffect(() => {
    onPreviewChange?.(activePreview);
  }, [activePreview, onPreviewChange]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  async function copyToken() {
    if (!state.token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(state.token);
      setToast({
        kind: "success",
        message: "Token copied.",
      });
    } catch {
      setToast({
        kind: "error",
        message: "Unable to copy the token.",
      });
    }
  }

  return (
    <div className="space-y-8">
      {toast ? (
        <div
          aria-live={toast.kind === "error" ? "assertive" : "polite"}
          className="pointer-events-none fixed right-6 top-6 z-[80] max-w-sm rounded-[16px] border px-4 py-3 shadow-[0_20px_40px_rgba(15,23,42,0.16)]"
          role={toast.kind === "error" ? "alert" : "status"}
          style={{
            backgroundColor: toast.kind === "error" ? "#FEF2F2" : "#ECFDF3",
            borderColor: toast.kind === "error" ? "#FECACA" : "#A7F3D0",
            color: toast.kind === "error" ? "#B42318" : "#027A48",
          }}
        >
          <p className="text-[14px] font-medium leading-6">{toast.message}</p>
        </div>
      ) : null}

      {isConfigured ? (
        <>
          <div>
            <p className="text-[17px] font-semibold text-[#111827]">Current token</p>
            <div className="mt-4 flex min-h-[56px] flex-col justify-center rounded-[18px] border border-[#F4C777] bg-[#FFFDF8] px-5 py-3">
              <div className="flex items-center gap-4">
                <code className="min-w-0 flex-1 overflow-x-auto text-[18px] tracking-[0.04em] text-[#111827]">
                  {displayToken}
                </code>
                {canCopyToken ? (
                  <button
                    aria-label="Copy token"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] text-[#8A94A6] transition hover:bg-white"
                    onClick={() => {
                      void copyToken();
                    }}
                    type="button"
                  >
                    <Copy className="h-6 w-6" strokeWidth={2} />
                  </button>
                ) : (
                  <form action={formAction}>
                    <input name="intent" type="hidden" value="delete" />
                    <button
                      aria-label="Delete token"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] text-[#D14343] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={pending}
                      type="submit"
                    >
                      <Trash2 className="h-6 w-6" strokeWidth={2} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-[22px] border border-[#E6EAF1] bg-white px-5 py-4">
          <p className="text-[18px] font-semibold text-[#111827]">No token yet</p>
          <p className="mt-2 text-[16px] leading-8 text-[#6B7280]">
            Generate a token when you&apos;re ready to connect the clipper or API client.
          </p>
        </div>
      )}

      {!isConfigured ? (
        <div className="rounded-[22px] border border-[#CFE2FF] bg-[#F4F9FF] p-5">
          <div className="flex items-start gap-4">
            <Info className="mt-0.5 h-6 w-6 text-[#3FA1F4]" strokeWidth={2} />
            <p className="text-[16px] leading-8 text-[#62718C]">
              Only one token can be active at a time. The full token is only shown once
              after generation.
            </p>
          </div>
        </div>
      ) : null}

      {state.token ? (
        <div className="rounded-[18px] border border-[#CBE8D5] bg-[#F1FBF4] px-5 py-4 text-[#256A3D]">
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
            This is the only time the full token will be shown. Use the copy button now.
          </p>
        </div>
      ) : null}

      {state.error ? (
        <p
          className="rounded-[18px] border border-[#F4C7C7] bg-[#FFF5F5] px-5 py-4 text-[15px] text-[#B42318]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-3 pt-1">
        <form action={formAction}>
          <input name="intent" type="hidden" value={isConfigured ? "rotate" : "generate"} />
          <button
            className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#3FA1F4] px-6 text-[18px] font-medium text-white transition hover:bg-[#3495E7] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={pending}
            type="submit"
          >
            {pending ? "Working..." : isConfigured ? "Rotate token" : "Generate token"}
          </button>
        </form>

        {onClose ? (
          <button
            className="inline-flex h-14 w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 text-[18px] font-medium text-[#111827] transition hover:bg-[#F8FAFC]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
