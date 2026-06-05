"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { formatCompactNumber } from "@/lib/documents/metrics";

type WordListSelectionFormProps = {
  lists: Array<{
    description: string;
    id: string;
    isSelected: boolean;
    name: string;
    syncedLabel: string;
    wordCount: number;
  }>;
  updateWordListsAction: (formData: FormData) => Promise<void>;
};

export function WordListSelectionForm({
  lists,
  updateWordListsAction,
}: WordListSelectionFormProps) {
  const [selectedWordListIds, setSelectedWordListIds] = useState(
    () => lists.filter((list) => list.isSelected).map((list) => list.id),
  );
  const selectedWordListIdSet = new Set(selectedWordListIds);

  function updateSelectedWordList(wordListId: string, isSelected: boolean) {
    setSelectedWordListIds((current) => {
      if (isSelected) {
        return current.includes(wordListId) ? current : [...current, wordListId];
      }

      return current.filter((id) => id !== wordListId);
    });
  }

  return (
    <form action={updateWordListsAction} className="mt-8" id="word-lists-form">
      <div className="text-muted mt-8 flex items-center justify-between text-[15px]">
        <span>{lists.length} lists available</span>
        <span>{selectedWordListIds.length} selected</span>
      </div>

      <div className="mt-5 space-y-4">
        {lists.map((list) => {
          const isSelected = selectedWordListIdSet.has(list.id);

          return (
            <label
              className={`selection-card ${isSelected ? "selection-card-active" : ""}`}
              data-selected={isSelected ? "true" : "false"}
              data-testid={`word-list-option-${list.id}`}
              key={list.id}
            >
              <input
                aria-label={list.name}
                checked={isSelected}
                className="sr-only"
                name="wordListId"
                onChange={(event) =>
                  updateSelectedWordList(list.id, event.currentTarget.checked)
                }
                type="checkbox"
                value={list.id}
              />
              <span
                className={`selection-check ${isSelected ? "selection-check-active" : ""}`}
              >
                <Check className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <span className="badge-accent px-3">
                      {list.name}
                    </span>
                    <p className="text-muted mt-4 max-w-[360px] text-[15px] leading-7">
                      {list.description}
                    </p>
                  </div>

                  <dl className="text-muted grid grid-cols-2 gap-x-[18px] gap-y-4 text-[14px] xl:w-[298px] xl:flex-none xl:grid-cols-[110px_170px]">
                    <div>
                      <dt className="text-muted">Words</dt>
                      <dd className="mt-1 text-[18px] font-semibold text-[var(--foreground)]">
                        {formatCompactNumber(list.wordCount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Last synced</dt>
                      <dd className="mt-1 text-[15px] text-[var(--foreground)]">
                        {list.syncedLabel}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </form>
  );
}
