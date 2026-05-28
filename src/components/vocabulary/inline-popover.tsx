"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function InlinePopover({
  children,
  panelClassName,
  trigger,
  triggerClassName,
}: {
  children: ReactNode;
  panelClassName: string;
  trigger: ReactNode;
  triggerClassName: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        className={triggerClassName}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {trigger}
      </button>

      {isOpen ? <div className={panelClassName}>{children}</div> : null}
    </div>
  );
}
