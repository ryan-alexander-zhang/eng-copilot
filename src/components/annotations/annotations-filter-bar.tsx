"use client";

import { List, Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const [query, setQuery] = useState(q);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    updateParams("q", deferredQuery.trim());
  }, [deferredQuery]);

  function updateParams(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (!value || value === "all" || (key === "sort" && value === "newest")) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    nextParams.delete("page");
    const queryString = nextParams.toString();

    router.replace(queryString.length > 0 ? `${pathname}?${queryString}` : pathname, {
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

        <FilterSelect
          onChange={(value) => updateParams("document", value)}
          options={[{ label: "All documents", value: "all" }, ...documents]}
          value={document}
        />
        <FilterSelect
          onChange={(value) => updateParams("wordList", value)}
          options={[{ label: "All word lists", value: "all" }, ...wordLists]}
          value={wordList}
        />
        <FilterSelect
          onChange={(value) => updateParams("type", value)}
          options={[{ label: "All types", value: "all" }, ...types]}
          value={type}
        />
        <FilterSelect
          dotColor={colors.find((option) => option.value === color)?.value !== "all" ? colors.find((option) => option.value === color)?.value : "#FFCF64"}
          onChange={(value) => updateParams("color", value)}
          options={colors}
          value={color}
        />
      </div>

      <div className="flex items-center gap-3">
        <FilterSelect
          onChange={(value) => updateParams("sort", value)}
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

function FilterSelect({
  dotColor,
  onChange,
  options,
  value,
}: {
  dotColor?: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  value: string;
}) {
  return (
    <div className="relative min-w-[176px]">
      {dotColor ? (
        <span
          className="pointer-events-none absolute left-4 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      <select
        className={`h-11 w-full appearance-none rounded-[12px] border border-[#E5E7EB] bg-white pr-10 text-[14px] font-medium text-[#374151] outline-none ${
          dotColor ? "pl-10" : "pl-4"
        }`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
        ˅
      </span>
    </div>
  );
}
