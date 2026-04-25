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
      <div className="mt-8 flex items-center justify-between text-[15px] text-[#6B7280]">
        <span>{lists.length} lists available</span>
        <span>{selectedWordListIds.length} selected</span>
      </div>

      <div className="mt-5 space-y-4">
        {lists.map((list) => {
          const isSelected = selectedWordListIdSet.has(list.id);

          return (
            <label
              className={`flex cursor-pointer items-start gap-5 rounded-[18px] border p-5 transition ${
                isSelected
                  ? "border-[#BFD7FF] bg-[#F8FBFF] shadow-[0_8px_24px_rgba(59,130,246,0.08)]"
                  : "border-[#E8EBF0] bg-white hover:border-[#D7DEE8]"
              }`}
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
                className={`mt-1 flex h-7 w-7 items-center justify-center rounded-[10px] border ${
                  isSelected
                    ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                    : "border-[#D0D5DD] bg-white text-transparent"
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-[12px] font-semibold text-[#3B82F6]">
                      {list.name}
                    </span>
                    <p className="mt-4 max-w-[360px] text-[15px] leading-7 text-[#6B7280]">
                      {list.description}
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-[14px] text-[#6B7280] xl:min-w-[260px]">
                    <div>
                      <dt className="text-[#9CA3AF]">Words</dt>
                      <dd className="mt-1 text-[18px] font-semibold text-[#111827]">
                        {formatCompactNumber(list.wordCount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#9CA3AF]">Last synced</dt>
                      <dd className="mt-1 text-[15px] text-[#111827]">
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
