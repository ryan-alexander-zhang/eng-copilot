"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function VocabularyDisclosure({
  children,
  className,
  trigger,
  triggerClassName,
}: {
  children: ReactNode;
  className?: string;
  trigger: ReactNode;
  triggerClassName: string;
}) {
  const disclosureRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!disclosureRef.current?.contains(event.target as Node)) {
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
    <div className={className} ref={disclosureRef}>
      <button
        aria-expanded={isOpen}
        className={triggerClassName}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {trigger}
      </button>
      {isOpen ? children : null}
    </div>
  );
}
