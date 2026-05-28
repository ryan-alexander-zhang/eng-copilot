"use client";

import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Trash2,
  X,
} from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ANNOTATION_COLORS,
  normalizeAnnotationColor,
} from "@/lib/annotations/presentation";
import type { AnnotationDraft } from "@/components/documents/document-reader";

type EditableAnnotation = {
  id: string;
  color?: string | null;
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
  onDeleteSuccess,
  onSaveSuccess,
  updateAction,
}: {
  annotation?: EditableAnnotation;
  createAction?: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  draft?: AnnotationDraft;
  mode: "create" | "edit";
  onClose: () => void;
  onDeleteSuccess?: () => void;
  onSaveSuccess?: () => void;
  updateAction?: (formData: FormData) => Promise<void>;
}) {
  const title = mode === "create" ? "New annotation" : "Edit annotation";
  const quote = draft?.quote ?? annotation?.quote ?? "";
  const formKey = `${mode}:${annotation?.id ?? quote}`;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#111827]/28 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-[760px] overflow-y-auto rounded-[24px] border border-[#E8EBF0] bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#EEF2F6] pb-5">
          <h2 className="text-[18px] font-semibold text-[#111827]">{title}</h2>
          <button
            aria-label="Close annotation editor"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280]"
            onClick={onClose}
            type="button"
          >
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
          onDeleteSuccess={onDeleteSuccess}
          onSaveSuccess={onSaveSuccess}
          quote={quote}
          updateAction={updateAction}
        />
      </div>
    </div>
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
  onDeleteSuccess,
  onSaveSuccess,
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
  onDeleteSuccess?: () => void;
  onSaveSuccess?: () => void;
  quote: string;
  updateAction?: (formData: FormData) => Promise<void>;
}) {
  const initialColor = normalizeAnnotationColor(annotation?.color);
  const [color, setColor] = useState(initialColor);
  const [pendingTag, setPendingTag] = useState("");
  const [tags, setTags] = useState(annotation?.tags ?? []);
  const noteFieldRef = useRef<HTMLTextAreaElement>(null);

  const action =
    mode === "create" && createAction
      ? createAction
      : mode === "edit" && updateAction
        ? updateAction
        : undefined;
  const saveAction =
    mode === "edit" && action
      ? async (formData: FormData) => {
          await action(formData);
          onSaveSuccess?.();
        }
      : action;

  const confirmDeleteAction =
    mode === "edit" && annotation && deleteAction
      ? async (formData: FormData) => {
          await deleteAction(formData);
          onDeleteSuccess?.();
        }
      : undefined;

  if (!saveAction) {
    return null;
  }

  return (
    <>
      <div className="mt-8 rounded-[14px] border border-[#F6D89A] bg-[#FFF7E8] px-4 py-4">
        <p className="text-[13px] text-[#6B7280]">Selected text</p>
        <p className="mt-3 text-[17px] leading-8 text-[#3D2F0A]">{quote}</p>
      </div>

      <form action={saveAction} className="mt-8 space-y-6" key={formKey}>
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
              <EditorIconButton
                icon={<Bold className="h-4 w-4" strokeWidth={2.2} />}
                label="Bold"
                onClick={() => {
                  applyTextFormatting(noteFieldRef.current, createWrappedFormatting("**"));
                }}
              />
              <EditorIconButton
                icon={<Italic className="h-4 w-4" strokeWidth={2.2} />}
                label="Italic"
                onClick={() => {
                  applyTextFormatting(noteFieldRef.current, createWrappedFormatting("*"));
                }}
              />
              <EditorIconButton
                icon={<List className="h-4 w-4" strokeWidth={2.2} />}
                label="Bulleted list"
                onClick={() => {
                  applyTextFormatting(noteFieldRef.current, createLinePrefixFormatting("- "));
                }}
              />
              <EditorIconButton
                icon={<ListOrdered className="h-4 w-4" strokeWidth={2.2} />}
                label="Numbered list"
                onClick={() => {
                  applyTextFormatting(noteFieldRef.current, createNumberedListFormatting);
                }}
              />
              <EditorIconButton
                icon={<Link2 className="h-4 w-4" strokeWidth={2.2} />}
                label="Insert link"
                onClick={() => {
                  applyTextFormatting(noteFieldRef.current, createLinkFormatting);
                }}
              />
            </div>
            <textarea
              className="min-h-[224px] w-full resize-none border-0 px-4 py-4 text-[15px] leading-8 text-[#374151] outline-none"
              defaultValue={annotation?.note ?? ""}
              id={`${formKey}-annotation-note`}
              name="note"
              placeholder="Add context, a definition, or your own study note..."
              ref={noteFieldRef}
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

      {mode === "edit" && annotation && confirmDeleteAction ? (
        <form
          action={confirmDeleteAction}
          className="mt-4 border-t border-[#EEF2F6] pt-4"
          onSubmit={(event) => {
            if (!window.confirm("Delete this annotation? This action cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
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

function EditorIconButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6B7280] transition hover:bg-[#F9FAFB]"
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
    </button>
  );
}

type TextFormatting = {
  replacement: string;
  selectionEndOffset: number;
  selectionStartOffset: number;
};

function applyTextFormatting(
  noteField: HTMLTextAreaElement | null,
  buildFormatting: (selectedText: string) => TextFormatting,
) {
  if (!noteField) {
    return;
  }

  const selectionStart = noteField.selectionStart ?? 0;
  const selectionEnd = noteField.selectionEnd ?? selectionStart;
  const selectedText = noteField.value.slice(selectionStart, selectionEnd);
  const formatting = buildFormatting(selectedText);
  const nextValue =
    noteField.value.slice(0, selectionStart) +
    formatting.replacement +
    noteField.value.slice(selectionEnd);

  noteField.value = nextValue;
  noteField.focus();
  noteField.setSelectionRange(
    selectionStart + formatting.selectionStartOffset,
    selectionStart + formatting.selectionEndOffset,
  );
  noteField.dispatchEvent(new Event("input", { bubbles: true }));
}

function createWrappedFormatting(marker: string) {
  return (selectedText: string): TextFormatting => {
    if (selectedText.length === 0) {
      return {
        replacement: `${marker}${marker}`,
        selectionEndOffset: marker.length,
        selectionStartOffset: marker.length,
      };
    }

    return {
      replacement: `${marker}${selectedText}${marker}`,
      selectionEndOffset: marker.length + selectedText.length,
      selectionStartOffset: marker.length,
    };
  };
}

function createLinePrefixFormatting(prefix: string) {
  return (selectedText: string): TextFormatting => {
    if (selectedText.length === 0) {
      return {
        replacement: prefix,
        selectionEndOffset: prefix.length,
        selectionStartOffset: prefix.length,
      };
    }

    const replacement = selectedText
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");

    return {
      replacement,
      selectionEndOffset: replacement.length,
      selectionStartOffset: 0,
    };
  };
}

function createNumberedListFormatting(selectedText: string): TextFormatting {
  if (selectedText.length === 0) {
    return {
      replacement: "1. ",
      selectionEndOffset: 3,
      selectionStartOffset: 3,
    };
  }

  const replacement = selectedText
    .split("\n")
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");

  return {
    replacement,
    selectionEndOffset: replacement.length,
    selectionStartOffset: 0,
  };
}

function createLinkFormatting(selectedText: string): TextFormatting {
  if (selectedText.length === 0) {
    return {
      replacement: "[link text](https://)",
      selectionEndOffset: 10,
      selectionStartOffset: 1,
    };
  }

  return {
    replacement: `[${selectedText}](https://)`,
    selectionEndOffset: selectedText.length + 11,
    selectionStartOffset: selectedText.length + 3,
  };
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
