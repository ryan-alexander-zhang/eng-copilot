"use client";

import { CheckCircle2, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { type ReactNode, useEffect, useRef, useState, useTransition } from "react";

export type DocumentShareState = {
  isActive: boolean;
  token: string;
} | null;

type DocumentShareButtonProps = {
  enableShareAction: () => Promise<DocumentShareState>;
  onShareChange: (share: DocumentShareState) => void;
  revokeShareAction: () => Promise<DocumentShareState>;
  share: DocumentShareState;
  shareLabel: string;
  variant: "menu-item" | "toolbar-button";
};

export function DocumentShareButton({
  enableShareAction,
  onShareChange,
  revokeShareAction,
  share,
  shareLabel,
  variant,
}: DocumentShareButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const shareUrl =
    share?.token && typeof window !== "undefined"
      ? `${window.location.origin}/shared/${share.token}`
      : share?.token
        ? `/shared/${share.token}`
        : "";
  const isShareActive = share?.isActive ?? false;

  useEffect(() => {
    if (!copiedLink) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedLink(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedLink]);

  async function handleCopyLink() {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
  }

  function handleToggleShare() {
    startTransition(() => {
      void (async () => {
        if (isShareActive) {
          onShareChange(await revokeShareAction());
          return;
        }

        onShareChange(await enableShareAction());
      })();
    });
  }

  return (
    <>
      <button
        className={
          variant === "menu-item"
            ? "menu-item"
            : "control-button h-10 gap-2 rounded-[12px] px-4 disabled:cursor-not-allowed disabled:opacity-70"
        }
        disabled={isPending}
        onClick={() => setIsShareModalOpen(true)}
        type="button"
      >
        <Share2
          className={variant === "menu-item" ? "menu-item-icon h-4 w-4" : "h-4 w-4"}
          strokeWidth={2}
        />
        Sharing
      </button>

      {isShareModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="modal-overlay">
              <div className="modal-panel max-w-[520px]">
                <h2 className="text-[20px] font-semibold">{`Share "${shareLabel}"`}</h2>
                <p className="text-muted mt-2 text-[14px]">
                  Anyone with the link can view (read-only).
                </p>

                <div className="modal-input-group mt-5">
                  <div className="flex items-center bg-[var(--surface-strong)]">
                    <input
                      className="text-muted h-11 flex-1 border-0 bg-transparent px-4 text-[13px] outline-none"
                      readOnly
                      value={isShareActive ? shareUrl : ""}
                    />
                    <button
                      className="modal-input-action h-11 disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!isShareActive || !shareUrl || isPending}
                      onClick={() => {
                        void handleCopyLink();
                      }}
                      type="button"
                    >
                      {copiedLink ? "Copied" : "Copy link"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 border-t border-[color:var(--border)] pt-5">
                  <p className="text-soft text-[13px] font-semibold">Link settings</p>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="text-muted mt-0.5 h-4 w-4"
                        strokeWidth={2}
                      />
                      <div>
                        <p className="text-soft text-[14px] font-medium">Read-only</p>
                        <p className="text-muted mt-1 text-[13px]">
                          Viewers can only read, cannot edit or add annotations.
                        </p>
                      </div>
                    </div>
                    <button
                      aria-checked={isShareActive}
                      aria-label="Read-only"
                      className={`toggle-switch mt-0.5 ${
                        isShareActive ? "toggle-switch-active" : ""
                      }`}
                      disabled={isPending}
                      onClick={handleToggleShare}
                      role="switch"
                      type="button"
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          isShareActive ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-7 flex justify-end">
                  <button
                    className="control-button control-button-primary h-10 min-w-[92px] rounded-[8px] px-5 text-[14px] font-medium"
                    onClick={() => setIsShareModalOpen(false)}
                    type="button"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function DocumentMoreActionsMenu({
  children,
  moveToTrashAction,
  onMoveToTrashSuccess,
  triggerClassName,
  triggerLabel,
}: {
  children?: ReactNode;
  moveToTrashAction: () => Promise<void>;
  onMoveToTrashSuccess?: () => void;
  triggerClassName?: string;
  triggerLabel: string;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMenuOpen]);

  function handleMoveToTrash() {
    setIsMenuOpen(false);

    startTransition(() => {
      void (async () => {
        await moveToTrashAction();
        onMoveToTrashSuccess?.();
      })();
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label={triggerLabel}
        className={
          triggerClassName ??
          "control-icon-button h-10 w-10 rounded-[12px]"
        }
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>

      {isMenuOpen ? (
        <div className="menu-panel absolute right-0 top-11 z-20 min-w-[176px]">
          {children}
          <button
            className="menu-item menu-item-danger"
            disabled={isPending}
            onClick={handleMoveToTrash}
            type="button"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
