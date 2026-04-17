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
    <form action={formAction}>
      <label htmlFor="file">Markdown file</label>
      <input id="file" name="file" type="file" accept=".md,.markdown,.mdown,.mkd,text/markdown" required />
      <p>Upload a Markdown file up to 512 KB.</p>
      {state.error ? <p>{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Uploading..." : "Upload document"}
      </button>
    </form>
  );
}
