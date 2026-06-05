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
          className="pointer-events-none fixed right-6 top-6 z-[80] max-w-sm rounded-[16px] border px-4 py-3 shadow-[0_20px_40px_rgba(97,52,18,0.14)]"
          role={toast.kind === "error" ? "alert" : "status"}
          style={{
            backgroundColor:
              toast.kind === "error"
                ? "var(--error-bg)"
                : "var(--warning-bg)",
            borderColor:
              toast.kind === "error"
                ? "var(--error-border)"
                : "var(--warning-border)",
            color:
              toast.kind === "error"
                ? "var(--error-foreground)"
                : "var(--warning-foreground)",
          }}
        >
          <p className="text-[14px] font-medium leading-6">{toast.message}</p>
        </div>
      ) : null}

      {isConfigured ? (
        <>
          <div>
            <p className="text-[17px] font-semibold text-[var(--foreground)]">
              Current token
            </p>
            <div className="mt-4 flex min-h-[56px] flex-col justify-center rounded-[18px] border border-[var(--warning-border)] bg-[var(--surface-soft)] px-5 py-3">
              <div className="flex items-center gap-4">
                <code className="min-w-0 flex-1 overflow-x-auto text-[18px] tracking-[0.04em] text-[var(--foreground)]">
                  {displayToken}
                </code>
                {canCopyToken ? (
                  <button
                    aria-label="Copy token"
                    className="icon-ghost-button text-muted inline-flex h-11 w-11 items-center justify-center rounded-[12px]"
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
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] text-[#D14343] transition hover:bg-[var(--error-bg)] disabled:cursor-not-allowed disabled:opacity-70"
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
        <div className="panel-card-accent rounded-[22px] px-5 py-4">
          <p className="text-[18px] font-semibold text-[var(--foreground)]">No token yet</p>
          <p className="text-soft mt-2 text-[16px] leading-8">
            Generate a token when you&apos;re ready to connect the clipper or API client.
          </p>
        </div>
      )}

      {!isConfigured ? (
        <div className="rounded-[22px] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-5">
          <div className="flex items-start gap-4">
            <Info className="mt-0.5 h-6 w-6 text-[var(--warning-foreground)]" strokeWidth={2} />
            <p className="text-[16px] leading-8 text-[var(--warning-foreground)]">
              Only one token can be active at a time. The full token is only shown once
              after generation.
            </p>
          </div>
        </div>
      ) : null}

      {state.token ? (
        <div className="rounded-[18px] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-5 py-4 text-[var(--warning-foreground)]">
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
            This is the only time the full token will be shown. Use the copy button now.
          </p>
        </div>
      ) : null}

      {state.error ? (
        <p
          className="rounded-[18px] border border-[var(--error-border)] bg-[var(--error-bg)] px-5 py-4 text-[15px] text-[var(--error-foreground)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-3 pt-1">
        <form action={formAction}>
          <input name="intent" type="hidden" value={isConfigured ? "rotate" : "generate"} />
          <button
            className="button-primary h-14 w-full justify-center px-6 text-[18px] tracking-[-0.02em] disabled:bg-[var(--accent-soft)] disabled:text-[var(--accent-soft-strong)]"
            disabled={pending}
            type="submit"
          >
            {pending ? "Working..." : isConfigured ? "Rotate token" : "Generate token"}
          </button>
        </form>

        {onClose ? (
          <button
            className="button-secondary h-14 w-full justify-center px-6 text-[18px] tracking-[-0.02em]"
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
