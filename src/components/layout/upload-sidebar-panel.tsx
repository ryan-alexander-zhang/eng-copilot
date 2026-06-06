"use client";

import { useActionState, useRef } from "react";
import { ArrowUpFromLine } from "lucide-react";
import type { UploadFormState } from "@/components/documents/upload-form";

const initialState: UploadFormState = {
  error: null,
};

export function UploadSidebarPanel({
  action,
}: {
  action: (state: UploadFormState, formData: FormData) => Promise<UploadFormState>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5" ref={formRef}>
      <input
        accept=".md,.markdown,.mdown,.mkd,text/markdown"
        className="hidden"
        id="sidebar-file-upload"
        name="file"
        onChange={() => {
          if (inputRef.current?.files?.length) {
            formRef.current?.requestSubmit();
          }
        }}
        ref={inputRef}
        required
        type="file"
      />
      <button
        className="button-primary flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-[14px] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <ArrowUpFromLine className="h-4 w-4" strokeWidth={2} />
        {pending ? "Uploading..." : "Upload document"}
      </button>

      <button
        className="flex min-h-[150px] w-full flex-col items-center justify-start rounded-[14px] border border-dashed bg-[var(--surface-strong)] px-6 pb-5 pt-6 text-center transition hover:bg-[var(--surface-soft)]"
        onClick={() => inputRef.current?.click()}
        style={{ borderColor: "var(--border)" }}
        type="button"
      >
        <div
          className="text-muted flex h-10 w-10 items-center justify-center rounded-full border bg-[var(--surface-soft)]"
          style={{ borderColor: "var(--border)" }}
        >
          <ArrowUpFromLine className="h-4 w-4" strokeWidth={2} />
        </div>
        <p className="text-soft mt-4 text-[15px] font-medium leading-6">
          Drop Markdown files here
          <br />
          or click to browse
        </p>
        <p className="text-muted mt-4 text-[12px]">Supports Markdown files up to 10 MB</p>
      </button>

      {state.error ? (
        <p
          className="rounded-[12px] border px-4 py-3 text-[13px]"
          style={{
            backgroundColor: "var(--error-bg)",
            borderColor: "var(--error-border)",
            color: "var(--error-foreground)",
          }}
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
