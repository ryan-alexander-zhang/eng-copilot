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
  className,
  name,
  onValueChange,
  options,
  panelClassName,
  value,
}: {
  className?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  options: AutoSubmitSelectOption[];
  panelClassName?: string;
  value: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const isControlled = typeof onValueChange === "function";
  const currentValue = isControlled ? value : selectedValue;
  const selectedOption =
    options.find((option) => option.value === currentValue) ?? options[0] ?? null;
  const selectedTitle =
    selectedOption && typeof selectedOption.label === "string" ? selectedOption.label : undefined;

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
    <div className={`relative min-w-[176px] ${className ?? ""}`.trim()} ref={rootRef}>
      {name ? <input name={name} ref={inputRef} type="hidden" value={currentValue} /> : null}
      <button
        aria-expanded={isOpen}
        className="select-trigger"
        onClick={() => setIsOpen((open) => !open)}
        title={selectedTitle}
        type="button"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`text-muted h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {isOpen ? (
        <div
          className={`select-panel ${panelClassName ?? ""}`.trim()}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === currentValue;
            const optionTitle =
              typeof option.label === "string" ? option.label : undefined;

            return (
              <button
                aria-selected={isSelected}
                className={`select-option ${isSelected ? "select-option-active" : ""}`}
                key={option.value}
                onClick={() => {
                  if (inputRef.current) {
                    inputRef.current.value = option.value;
                  }
                  setIsOpen(false);

                  if (isControlled) {
                    onValueChange(option.value);
                    return;
                  }

                  setSelectedValue(option.value);
                  rootRef.current?.closest("form")?.requestSubmit();
                }}
                role="option"
                title={optionTitle}
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
