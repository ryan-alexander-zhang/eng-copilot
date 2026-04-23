import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  FileText,
  Link2,
  MessageSquareText,
  Share2,
  Trash2,
} from "lucide-react";

type LibraryNavSidebarProps = {
  activeItem: "documents";
  counts: {
    documents: number;
    wordLists: number;
    annotations: number;
    sharedWithMe: number;
    readOnlyLinks: number;
    trash: number;
  };
  storage: {
    usedLabel: string;
    totalLabel: string;
    progress: number;
  };
};

export function LibraryNavSidebar({
  activeItem,
  counts,
  storage,
}: LibraryNavSidebarProps) {
  return (
    <div className="flex flex-col gap-5">
      <NavSectionTitle title="My Library" />
      <div className="space-y-1">
        <NavItem
          active={activeItem === "documents"}
          count={counts.documents}
          href="/documents"
          icon={<FileText className="h-4 w-4" strokeWidth={2} />}
          label="Documents"
        />
        <NavItem
          count={counts.wordLists}
          href="/word-lists"
          icon={<BookOpen className="h-4 w-4" strokeWidth={2} />}
          label="Word Lists"
        />
        <NavItem
          count={counts.annotations}
          disabled
          icon={<MessageSquareText className="h-4 w-4" strokeWidth={2} />}
          label="Annotations"
        />
        <NavItem
          count={counts.sharedWithMe}
          disabled
          icon={<Share2 className="h-4 w-4" strokeWidth={2} />}
          label="Shared with Me"
        />
        <NavItem
          count={counts.readOnlyLinks}
          disabled
          icon={<Link2 className="h-4 w-4" strokeWidth={2} />}
          label="Read-Only Links"
        />
        <NavItem
          count={counts.trash}
          disabled
          icon={<Trash2 className="h-4 w-4" strokeWidth={2} />}
          label="Trash"
        />
      </div>

      <section className="rounded-[16px] border border-[#E7EBF1] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <h3 className="text-[14px] font-semibold text-[#111827]">Storage</h3>
        <p className="mt-2 text-[12px] text-[#9CA3AF]">
          {storage.usedLabel} of {storage.totalLabel} used
        </p>
        <div className="mt-3 h-2 rounded-full bg-[#EEF2F7]">
          <div
            className="h-2 rounded-full bg-[#3B82F6]"
            style={{ width: `${Math.max(6, Math.min(100, storage.progress * 100))}%` }}
          />
        </div>
        <button
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-[10px] border border-[#DCE5F3] bg-[#F8FBFF] text-[14px] font-medium text-[#3B82F6]"
          type="button"
        >
          Upgrade plan
        </button>
      </section>

      <section className="rounded-[16px] border border-[#E7EBF1] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <p className="text-[14px] font-semibold text-[#111827]">Learn more, together.</p>
        <p className="mt-3 text-[13px] leading-6 text-[#6B7280]">
          Share read-only links so others can learn without editing.
        </p>
        <button
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-[10px] border border-[#E5E7EB] text-[14px] font-medium text-[#3B82F6]"
          type="button"
        >
          See how it works
        </button>
      </section>
    </div>
  );
}

function NavSectionTitle({ title }: { title: string }) {
  return <h2 className="text-[15px] font-semibold text-[#111827]">{title}</h2>;
}

function NavItem({
  active = false,
  count,
  disabled = false,
  href,
  icon,
  label,
}: {
  active?: boolean;
  count: number;
  disabled?: boolean;
  href?: string;
  icon: ReactNode;
  label: string;
}) {
  const className = `flex items-center justify-between rounded-[12px] px-3 py-3 text-[14px] font-medium transition ${
    active
      ? "bg-[#F4F8FF] text-[#2563EB]"
      : disabled
        ? "cursor-default text-[#6B7280]"
        : "text-[#4B5563] hover:bg-[#F8FAFC]"
  }`;
  const content = (
    <>
      <span className="flex items-center gap-3">
        <span className={active ? "text-[#3B82F6]" : "text-[#9CA3AF]"}>{icon}</span>
        {label}
      </span>
      <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[12px] text-[#6B7280]">
        {count}
      </span>
    </>
  );

  if (disabled || !href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}
