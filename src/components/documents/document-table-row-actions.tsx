"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Copy,
  Link2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DocumentMoreActionsMenu,
  DocumentShareButton,
  type DocumentShareState,
} from "@/components/documents/document-more-actions-menu";

export function DocumentTableRowActions({
  documentId,
  enableShareAction,
  initialShare,
  moveToTrashAction,
  revokeShareAction,
  originalName,
  title,
}: {
  documentId: string;
  enableShareAction: (formData: FormData) => Promise<DocumentShareState>;
  initialShare: DocumentShareState;
  moveToTrashAction: (formData: FormData) => Promise<void>;
  revokeShareAction: (formData: FormData) => Promise<DocumentShareState>;
  originalName: string;
  title: string;
}) {
  const router = useRouter();
  const [copiedTarget, setCopiedTarget] = useState<"link" | "title" | null>(null);
  const [share, setShare] = useState<DocumentShareState>(initialShare);
  const shareLabel = originalName || title;

  useEffect(() => {
    if (!copiedTarget) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedTarget(null);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedTarget]);

  function buildFormData() {
    const formData = new FormData();
    formData.set("documentId", documentId);

    return formData;
  }

  async function handleCopyTitle() {
    await navigator.clipboard.writeText(shareLabel);
    setCopiedTarget("title");
  }

  return (
    <>
      <td className="px-4 py-5">
        {share?.isActive ? (
          <span className="status-badge-success">
            Read-only link active
          </span>
        ) : (
          <span className="text-muted text-[14px]">-</span>
        )}
      </td>
      <td className="px-4 py-5">
        <div className="text-soft relative flex items-center gap-1">
          {copiedTarget === "title" ? (
            <div
              className="tooltip-bubble pointer-events-none absolute right-10 top-[-40px]"
              role="status"
            >
              Copied
            </div>
          ) : null}
          <Link
            aria-label={`Open ${title}`}
            className="icon-ghost-button h-9 w-9"
            href={`/documents/${documentId}`}
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <button
            aria-label={`Copy ${title}`}
            className="icon-ghost-button h-9 w-9"
            onClick={() => {
              void handleCopyTitle();
            }}
            type="button"
          >
            <Copy className="h-4 w-4" strokeWidth={2} />
          </button>
          <Link
            aria-label={`Open shared view for ${title}`}
            className={`icon-ghost-button h-9 w-9 ${
              share?.isActive ? "" : "pointer-events-none opacity-35"
            }`}
            href={share?.isActive ? `/shared/${share.token}` : "#"}
          >
            <Link2 className="h-4 w-4" strokeWidth={2} />
          </Link>
          <DocumentMoreActionsMenu
            moveToTrashAction={async () => {
              await moveToTrashAction(buildFormData());
            }}
            onMoveToTrashSuccess={() => {
              router.refresh();
            }}
            triggerClassName="icon-ghost-button h-9 w-9"
            triggerLabel={`More actions for ${title}`}
          >
            <DocumentShareButton
              enableShareAction={async () => {
                const nextShare = await enableShareAction(buildFormData());
                setShare(nextShare);
                router.refresh();

                return nextShare;
              }}
              onShareChange={(nextShare) => {
                setShare(nextShare);
              }}
              revokeShareAction={async () => {
                const nextShare =
                  (await revokeShareAction(buildFormData())) ??
                  (share ? { ...share, isActive: false } : null);
                setShare(nextShare);
                router.refresh();

                return nextShare;
              }}
              share={share}
              shareLabel={shareLabel}
              variant="menu-item"
            />
          </DocumentMoreActionsMenu>
        </div>
      </td>
    </>
  );
}
