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
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#3D8CEB] text-[14px] font-semibold text-white transition hover:bg-[#357FDE] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <ArrowUpFromLine className="h-4 w-4" strokeWidth={2} />
        {pending ? "Uploading..." : "Upload Markdown"}
      </button>

      <button
        className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-[14px] border border-dashed border-[#D6DCE5] bg-white px-6 text-center transition hover:border-[#BFC8D6] hover:bg-[#FBFCFE]"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E8F0] bg-[#F9FAFB] text-[#6B7280]">
          <ArrowUpFromLine className="h-4 w-4" strokeWidth={2} />
        </div>
        <p className="mt-4 text-[15px] font-medium leading-6 text-[#374151]">
          Drop .md files here
          <br />
          or click to browse
        </p>
        <p className="mt-4 text-[12px] text-[#9CA3AF]">Supports Markdown files up to 10 MB</p>
      </button>

      {state.error ? (
        <p
          className="rounded-[12px] border border-[#F3C5C5] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B42318]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
