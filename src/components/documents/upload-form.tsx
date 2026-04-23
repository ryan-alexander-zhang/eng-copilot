"use client";

import { useActionState } from "react";

export type UploadFormState = {
  error: string | null;
};

const initialState: UploadFormState = {
  error: null,
};

export function UploadForm({
  action,
}: {
  action: (state: UploadFormState, formData: FormData) => Promise<UploadFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="field-label" htmlFor="file">
          Markdown file
        </label>
        <input
          accept=".md,.markdown,.mdown,.mkd,text/markdown"
          className="field-file"
          id="file"
          name="file"
          required
          type="file"
        />
        <p className="text-xs text-zinc-500">Accepted: .md, .markdown, .mdown, .mkd</p>
      </div>
      <div className="rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50 px-4 py-4 text-sm leading-7 text-zinc-600">
        <p className="font-medium text-zinc-900">Before you upload</p>
        <p className="mt-2">Use one Markdown file up to 10 MB.</p>
        <p>Headings and paragraphs work best for a clean reading layout.</p>
      </div>
      {state.error ? (
        <p
          className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <button className="button-primary w-full justify-center" disabled={pending} type="submit">
        {pending ? "Uploading..." : "Upload and open"}
      </button>
    </form>
  );
}
