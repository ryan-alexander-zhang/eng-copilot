"use client";

import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  TableProperties,
  Trash2,
  X,
} from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ANNOTATION_COLORS,
  normalizeAnnotationColor,
} from "@/lib/annotations/presentation";
import type { AnnotationDraft } from "@/components/documents/document-reader";

type EditableAnnotation = {
  id: string;
  color?: string;
  note: string;
  quote: string;
  tags: string[];
};

export function AnnotationEditorPanel({
  annotation,
  createAction,
  deleteAction,
  draft,
  mode,
  onClose,
  updateAction,
}: {
  annotation?: EditableAnnotation;
  createAction?: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  draft?: AnnotationDraft;
  mode: "create" | "edit";
  onClose: () => void;
  updateAction?: (formData: FormData) => Promise<void>;
}) {
  const title = mode === "create" ? "New annotation" : "Edit annotation";
  const quote = draft?.quote ?? annotation?.quote ?? "";
  const formKey = `${mode}:${annotation?.id ?? quote}`;

  return (
    <aside className="w-full max-w-[320px] border-l border-[#E8EBF0] bg-white px-5 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#111827]">{title}</h2>
        <button className="text-[#9CA3AF]" onClick={onClose} type="button">
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <EditorPanelForm
        annotation={annotation}
        createAction={createAction}
        deleteAction={deleteAction}
        draft={draft}
        formKey={formKey}
        mode={mode}
        onClose={onClose}
        quote={quote}
        updateAction={updateAction}
      />
    </aside>
  );
}

function EditorPanelForm({
  annotation,
  createAction,
  deleteAction,
  draft,
  formKey,
  mode,
  onClose,
  quote,
  updateAction,
}: {
  annotation?: EditableAnnotation;
  createAction?: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  draft?: AnnotationDraft;
  formKey: string;
  mode: "create" | "edit";
  onClose: () => void;
  quote: string;
  updateAction?: (formData: FormData) => Promise<void>;
}) {
  const initialColor = normalizeAnnotationColor(annotation?.color);
  const initialTags = useMemo(() => annotation?.tags ?? [], [annotation?.tags]);
  const [color, setColor] = useState(initialColor);
  const [pendingTag, setPendingTag] = useState("");
  const [tags, setTags] = useState(initialTags);

  useEffect(() => {
    setColor(initialColor);
    setPendingTag("");
    setTags(initialTags);
  }, [formKey, initialColor, initialTags]);

  const action =
    mode === "create" && createAction
      ? createAction
      : mode === "edit" && updateAction
        ? updateAction
        : undefined;

  if (!action) {
    return null;
  }

  return (
    <>
      <div className="mt-8 rounded-[14px] border border-[#F6D89A] bg-[#FFF7E8] px-4 py-4">
        <p className="text-[13px] text-[#6B7280]">Selected text</p>
        <p className="mt-3 text-[17px] leading-8 text-[#3D2F0A]">{quote}</p>
      </div>

      <form action={action} className="mt-8 space-y-6" key={formKey}>
        {draft ? (
          <>
            <input name="startBlockKey" type="hidden" value={draft.startBlockKey} />
            <input name="startOffset" type="hidden" value={draft.startOffset.toString()} />
            <input name="endBlockKey" type="hidden" value={draft.endBlockKey} />
            <input name="endOffset" type="hidden" value={draft.endOffset.toString()} />
          </>
        ) : null}
        {annotation ? <input name="annotationId" type="hidden" value={annotation.id} /> : null}
        <input name="color" type="hidden" value={color} />
        {tags.map((tag) => (
          <input key={tag} name="tags" type="hidden" value={tag} />
        ))}

        <div className="space-y-2">
          <label className="field-label" htmlFor={`${formKey}-annotation-note`}>
            Note
          </label>
          <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB]">
            <div className="flex items-center gap-1 border-b border-[#E5E7EB] px-3 py-2">
              <EditorIconButton icon={<Bold className="h-4 w-4" strokeWidth={2.2} />} />
              <EditorIconButton icon={<Italic className="h-4 w-4" strokeWidth={2.2} />} />
              <EditorIconButton icon={<List className="h-4 w-4" strokeWidth={2.2} />} />
              <EditorIconButton icon={<ListOrdered className="h-4 w-4" strokeWidth={2.2} />} />
              <EditorIconButton icon={<Link2 className="h-4 w-4" strokeWidth={2.2} />} />
              <EditorIconButton icon={<TableProperties className="h-4 w-4" strokeWidth={2.2} />} />
            </div>
            <textarea
              className="min-h-[224px] w-full resize-none border-0 px-4 py-4 text-[15px] leading-8 text-[#374151] outline-none"
              defaultValue={annotation?.note ?? ""}
              id={`${formKey}-annotation-note`}
              name="note"
              placeholder="Add context, a definition, or your own study note..."
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="field-label">Tags (optional)</p>
          <div className="rounded-[14px] border border-[#E5E7EB] px-3 py-3">
            {tags.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[#FFF5DF] px-3 py-1 text-[12px] font-medium text-[#6A5300]"
                    key={tag}
                    onClick={() => {
                      setTags((currentTags) => currentTags.filter((currentTag) => currentTag !== tag));
                    }}
                    type="button"
                  >
                    {tag}
                    <X className="h-3 w-3" strokeWidth={2.2} />
                  </button>
                ))}
              </div>
            ) : null}
            <input
              className="w-full border-0 bg-transparent text-[14px] text-[#374151] outline-none placeholder:text-[#9CA3AF]"
              onChange={(event) => setPendingTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== ",") {
                  return;
                }

                event.preventDefault();
                appendTag({
                  pendingTag,
                  setPendingTag,
                  setTags,
                });
              }}
              placeholder="Add a tag..."
              type="text"
              value={pendingTag}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="field-label">Color</p>
          <div className="flex flex-wrap gap-4">
            {ANNOTATION_COLORS.map((option) => {
              const isSelected = color === option.value;

              return (
                <button
                  aria-label={`Use ${option.value} highlight`}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                    isSelected ? "border-current" : "border-transparent"
                  }`}
                  key={option.value}
                  onClick={() => setColor(option.value)}
                  style={{
                    backgroundColor: option.dot,
                    color: option.dot,
                  }}
                  type="button"
                >
                  {isSelected ? <span className="h-3 w-3 rounded-full border-2 border-white" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <button className="button-primary h-11 w-full justify-center" type="submit">
            Save annotation
          </button>
          <button className="button-secondary h-11 w-full justify-center" onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </form>

      {mode === "edit" && annotation && deleteAction ? (
        <form action={deleteAction} className="mt-4 border-t border-[#EEF2F6] pt-4">
          <input name="annotationId" type="hidden" value={annotation.id} />
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-semibold text-[#E14D45]"
            type="submit"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
            Delete annotation
          </button>
        </form>
      ) : null}
    </>
  );
}

function EditorIconButton({ icon }: { icon: ReactNode }) {
  return (
    <button
      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6B7280] transition hover:bg-[#F9FAFB]"
      type="button"
    >
      {icon}
    </button>
  );
}

function appendTag(input: {
  pendingTag: string;
  setPendingTag: (value: string) => void;
  setTags: Dispatch<SetStateAction<string[]>>;
}) {
  const normalizedTag = input.pendingTag.trim().toLowerCase();

  if (normalizedTag.length === 0) {
    return;
  }

  input.setTags((currentTags) =>
    currentTags.includes(normalizedTag) ? currentTags : [...currentTags, normalizedTag],
  );
  input.setPendingTag("");
}
