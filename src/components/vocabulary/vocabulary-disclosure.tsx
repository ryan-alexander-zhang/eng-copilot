"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

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
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const wrapperClassName = className ?? "relative";

  function syncPanelPosition() {
    const rect = triggerRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    setPanelStyle({
      height: rect.height,
      left: rect.left,
      position: "fixed",
      top: rect.top,
      width: rect.width,
      zIndex: 40,
    });
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    syncPanelPosition();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleViewportChange() {
      syncPanelPosition();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  return (
    <>
      <div className={wrapperClassName} ref={triggerRef}>
        <button
          aria-expanded={isOpen}
          className={triggerClassName}
          onClick={() => {
            if (!isOpen) {
              syncPanelPosition();
            }

            setIsOpen((open) => !open);
          }}
          type="button"
        >
          {trigger}
        </button>
      </div>
      {isOpen && panelStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              className={wrapperClassName}
              onSubmitCapture={() => setIsOpen(false)}
              ref={panelRef}
              style={panelStyle}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
