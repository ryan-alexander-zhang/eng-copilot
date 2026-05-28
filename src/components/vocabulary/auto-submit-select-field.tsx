"use client";

import { ChevronDown, Check } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AutoSubmitSelectOption = {
  label: ReactNode;
  value: string;
};

export function AutoSubmitSelectField({
  name,
  options,
  value,
}: {
  name: string;
  options: AutoSubmitSelectOption[];
  value: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? options[0] ?? null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative min-w-[176px]" ref={rootRef}>
      <input name={name} ref={inputRef} type="hidden" value={selectedValue} />
      <button
        aria-expanded={isOpen}
        className="flex h-11 w-full items-center justify-between rounded-[14px] border border-[#E3E8F1] bg-white px-4 text-[14px] font-medium text-[#475569] outline-none transition hover:bg-[#F8FAFC] focus:border-[#BFD3FF] focus:ring-4 focus:ring-[#DCE8FF]"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-[#94A3B8] transition ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-[16px] border border-[#E3E8F1] bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <button
                aria-selected={isSelected}
                className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] transition ${
                  isSelected
                    ? "bg-[#EEF4FF] font-medium text-[#2563EB]"
                    : "text-[#475569] hover:bg-[#F8FAFC]"
                }`}
                key={option.value}
                onClick={() => {
                  if (inputRef.current) {
                    inputRef.current.value = option.value;
                  }
                  setSelectedValue(option.value);
                  setIsOpen(false);
                  rootRef.current?.closest("form")?.requestSubmit();
                }}
                role="option"
                type="button"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  {isSelected ? <Check className="h-4 w-4" strokeWidth={2.5} /> : null}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
