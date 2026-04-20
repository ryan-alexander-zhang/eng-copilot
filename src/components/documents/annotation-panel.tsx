"use client";

import { useState, type ChangeEvent } from "react";

type AnnotationPanelBlock = {
  blockKey: string;
  text: string;
};

type AnnotationPanelAnnotation = {
  id: string;
  startBlockKey: string;
  startOffset: number;
  endBlockKey: string;
  endOffset: number;
  quote: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

export function AnnotationPanel({
  blocks,
  annotations,
  createAction,
  updateAction,
  deleteAction,
}: {
  blocks: AnnotationPanelBlock[];
  annotations: AnnotationPanelAnnotation[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const hasBlocks = blocks.length > 0;
  const firstBlock = hasBlocks ? blocks[0] : null;
  const [endBlockKey, setEndBlockKey] = useState(firstBlock?.blockKey ?? "");
  const [endOffset, setEndOffset] = useState(firstBlock?.text.length.toString() ?? "0");

  function handleEndBlockKeyChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextBlockKey = event.target.value;
    const nextBlock = blocks.find((block) => block.blockKey === nextBlockKey);

    setEndBlockKey(nextBlockKey);
    setEndOffset(nextBlock ? nextBlock.text.length.toString() : "0");
  }

  return (
    <section aria-label="Annotation panel">
      <h2>Annotations</h2>
      {!hasBlocks ? (
        <p>Add document content before creating annotations.</p>
      ) : (
        <form action={createAction}>
          <fieldset>
            <legend>Create annotation</legend>
            <label htmlFor="startBlockKey">Start block</label>
            <select id="startBlockKey" name="startBlockKey" defaultValue={firstBlock!.blockKey}>
              {blocks.map((block) => (
                <option key={block.blockKey} value={block.blockKey}>
                  {block.blockKey} - {truncateBlockText(block.text)}
                </option>
              ))}
            </select>
            <label htmlFor="startOffset">Start offset</label>
            <input id="startOffset" name="startOffset" type="number" min="0" defaultValue="0" required />
            <label htmlFor="endBlockKey">End block</label>
            <select id="endBlockKey" name="endBlockKey" value={endBlockKey} onChange={handleEndBlockKeyChange}>
              {blocks.map((block) => (
                <option key={block.blockKey} value={block.blockKey}>
                  {block.blockKey} - {truncateBlockText(block.text)}
                </option>
              ))}
            </select>
            <label htmlFor="endOffset">End offset</label>
            <input
              id="endOffset"
              name="endOffset"
              type="number"
              min="0"
              value={endOffset}
              onChange={(event) => setEndOffset(event.target.value)}
              required
            />
            <label htmlFor="note">Note</label>
            <textarea id="note" name="note" rows={3} />
            <button type="submit">Create annotation</button>
          </fieldset>
        </form>
      )}
      {annotations.length === 0 ? <p>No annotations yet.</p> : null}
      <ul>
        {annotations.map((annotation) => (
          <li key={annotation.id}>
            <p>
              <strong>Quote:</strong> {annotation.quote}
            </p>
            <p>
              {annotation.startBlockKey}:{annotation.startOffset} to {annotation.endBlockKey}:
              {annotation.endOffset}
            </p>
            <p>
              Created{" "}
              <time dateTime={annotation.createdAt.toISOString()}>
                {annotation.createdAt.toLocaleString()}
              </time>
            </p>
            {annotation.updatedAt.getTime() !== annotation.createdAt.getTime() ? (
              <p>
                Updated{" "}
                <time dateTime={annotation.updatedAt.toISOString()}>
                  {annotation.updatedAt.toLocaleString()}
                </time>
              </p>
            ) : null}
            <form action={updateAction}>
              <input type="hidden" name="annotationId" value={annotation.id} />
              <label htmlFor={`note-${annotation.id}`}>Note</label>
              <textarea
                id={`note-${annotation.id}`}
                name="note"
                defaultValue={annotation.note}
                rows={3}
              />
              <button type="submit">Update note</button>
            </form>
            <form action={deleteAction}>
              <input type="hidden" name="annotationId" value={annotation.id} />
              <button type="submit">Delete annotation</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

function truncateBlockText(text: string) {
  return text.length > 40 ? `${text.slice(0, 37)}...` : text;
}
