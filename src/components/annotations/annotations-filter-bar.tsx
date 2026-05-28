"use client";

import { List, Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AutoSubmitSelectField,
  type AutoSubmitSelectOption,
} from "@/components/vocabulary/auto-submit-select-field";

type FilterOption = {
  label: string;
  value: string;
};

export function AnnotationsFilterBar({
  color,
  colors,
  document,
  documents,
  q,
  sort,
  type,
  types,
  wordList,
  wordLists,
}: {
  color: string;
  colors: FilterOption[];
  document: string;
  documents: FilterOption[];
  q: string;
  sort: string;
  type: string;
  types: FilterOption[];
  wordList: string;
  wordLists: FilterOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();
  const [query, setQuery] = useState(q);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const nextParams = new URLSearchParams(currentQueryString);
    const value = deferredQuery.trim();

    if (!value) {
      nextParams.delete("q");
    } else {
      nextParams.set("q", value);
    }

    nextParams.delete("page");
    const queryString = nextParams.toString();
    const nextHref = queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
    const currentHref =
      currentQueryString.length > 0 ? `${pathname}?${currentQueryString}` : pathname;

    if (nextHref === currentHref) {
      return;
    }

    router.replace(nextHref, {
      scroll: false,
    });
  }, [currentQueryString, deferredQuery, pathname, router]);

  function updateParams(key: string, value: string) {
    const nextParams = new URLSearchParams(currentQueryString);

    if (!value || value === "all" || (key === "sort" && value === "newest")) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    nextParams.delete("page");
    const queryString = nextParams.toString();
    const nextHref = queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
    const currentHref =
      currentQueryString.length > 0 ? `${pathname}?${currentQueryString}` : pathname;

    if (nextHref === currentHref) {
      return;
    }

    router.replace(nextHref, {
      scroll: false,
    });
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:items-center">
        <div className="relative w-full xl:max-w-[274px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={2} />
          <input
            className="h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white pl-11 pr-4 text-[14px] text-[#111827] outline-none transition focus:border-[#BFDBFE] focus:ring-4 focus:ring-[#DBEAFE]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search annotations..."
            type="search"
            value={query}
          />
        </div>

        <AutoSubmitSelectField
          onValueChange={(value) => updateParams("document", value)}
          options={[{ label: "All documents", value: "all" }, ...documents]}
          value={document}
        />
        <AutoSubmitSelectField
          onValueChange={(value) => updateParams("wordList", value)}
          options={[{ label: "All word lists", value: "all" }, ...wordLists]}
          value={wordList}
        />
        <AutoSubmitSelectField
          onValueChange={(value) => updateParams("type", value)}
          options={[{ label: "All types", value: "all" }, ...types]}
          value={type}
        />
        <AutoSubmitSelectField
          onValueChange={(value) => updateParams("color", value)}
          options={colors.map((option) => ({
            label: renderOptionLabel(option),
            value: option.value,
          }))}
          value={color}
        />
      </div>

      <div className="flex items-center gap-3">
        <AutoSubmitSelectField
          onValueChange={(value) => updateParams("sort", value)}
          options={[
            { label: "Newest first", value: "newest" },
            { label: "Oldest first", value: "oldest" },
          ]}
          value={sort}
        />
        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white text-[#4B5563]"
          type="button"
        >
          <List className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function renderOptionLabel(option: FilterOption): AutoSubmitSelectOption["label"] {
  if (option.value === "all") {
    return option.label;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: option.value }}
      />
      <span>{option.label}</span>
    </span>
  );
}
