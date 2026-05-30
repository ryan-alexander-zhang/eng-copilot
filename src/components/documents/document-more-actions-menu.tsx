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
            ? "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium text-[#374151] transition hover:bg-[#F8FAFC]"
            : "inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E5E7EB] px-4 text-[14px] font-medium text-[#374151] disabled:cursor-not-allowed disabled:opacity-70"
        }
        disabled={isPending}
        onClick={() => setIsShareModalOpen(true)}
        type="button"
      >
        <Share2
          className={variant === "menu-item" ? "h-4 w-4 text-[#667085]" : "h-4 w-4"}
          strokeWidth={2}
        />
        Sharing
      </button>

      {isShareModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/20 p-4 backdrop-blur-[2px]">
              <div className="w-full max-w-[520px] rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                <h2 className="text-[20px] font-semibold text-[#111827]">{`Share "${shareLabel}"`}</h2>
                <p className="mt-2 text-[14px] text-[#667085]">
                  Anyone with the link can view (read-only).
                </p>

                <div className="mt-5 overflow-hidden rounded-[12px] border border-[#E5E7EB]">
                  <div className="flex items-center bg-white">
                    <input
                      className="h-11 flex-1 border-0 bg-transparent px-4 text-[13px] text-[#667085] outline-none"
                      readOnly
                      value={isShareActive ? shareUrl : ""}
                    />
                    <button
                      className="inline-flex h-11 items-center justify-center border-l border-[#E5E7EB] bg-[#F8FAFC] px-4 text-[13px] font-medium text-[#4B5563] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:text-[#9CA3AF]"
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

                <div className="mt-6 border-t border-[#EEF2F6] pt-5">
                  <p className="text-[13px] font-semibold text-[#344054]">Link settings</p>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 text-[#98A2B3]"
                        strokeWidth={2}
                      />
                      <div>
                        <p className="text-[14px] font-medium text-[#344054]">Read-only</p>
                        <p className="mt-1 text-[13px] text-[#98A2B3]">
                          Viewers can only read, cannot edit or add annotations.
                        </p>
                      </div>
                    </div>
                    <button
                      aria-checked={isShareActive}
                      aria-label="Read-only"
                      className={`relative mt-0.5 inline-flex h-6 w-11 rounded-full transition ${
                        isShareActive ? "bg-[#4F9CF9]" : "bg-[#D0D5DD]"
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
                    className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-[8px] bg-[#2F80ED] px-5 text-[14px] font-medium text-white transition hover:bg-[#256ED1]"
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
          "inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] text-[#6B7280]"
        }
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>

      {isMenuOpen ? (
        <div className="absolute right-0 top-11 z-20 min-w-[176px] rounded-[14px] border border-[#E5E7EB] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
          {children}
          <button
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium text-[#E14D45] transition hover:bg-[#FFF5F5]"
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
