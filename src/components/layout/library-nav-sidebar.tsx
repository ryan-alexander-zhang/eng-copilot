import Link from "next/link";
import type { ReactNode } from "react";
import {
  FileText,
  Link2,
  Share2,
  Trash2,
} from "lucide-react";

export type LibraryNavItem =
  | "documents"
  | "read-only-links"
  | "shared-with-me"
  | "trash";

type LibraryNavSidebarProps = {
  activeItem: LibraryNavItem;
  counts: {
    documents: number;
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
          active={activeItem === "shared-with-me"}
          count={counts.sharedWithMe}
          href="/shared-with-me"
          icon={<Share2 className="h-4 w-4" strokeWidth={2} />}
          label="Shared with Me"
        />
        <NavItem
          active={activeItem === "read-only-links"}
          count={counts.readOnlyLinks}
          href="/read-only-links"
          icon={<Link2 className="h-4 w-4" strokeWidth={2} />}
          label="Read-Only Links"
        />
        <NavItem
          active={activeItem === "trash"}
          count={counts.trash}
          href="/trash"
          icon={<Trash2 className="h-4 w-4" strokeWidth={2} />}
          label="Trash"
        />
      </div>

      <section className="panel-card">
        <h3 className="text-[14px] font-semibold">Storage</h3>
        <p className="text-muted mt-2 text-[12px]">
          {storage.usedLabel} of {storage.totalLabel} used
        </p>
        <div className="progress-track mt-3 h-2 rounded-full">
          <div
            className="progress-fill h-2 rounded-full"
            style={{ width: `${Math.max(6, Math.min(100, storage.progress * 100))}%` }}
          />
        </div>
        <button
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-[10px] border bg-[var(--accent-soft)] text-[14px] font-medium text-[var(--accent-strong)]"
          style={{ borderColor: "var(--border)" }}
          type="button"
        >
          Upgrade plan
        </button>
      </section>

      <section className="panel-card">
        <p className="text-[14px] font-semibold">Learn more, together.</p>
        <p className="text-muted mt-3 text-[13px] leading-6">
          Share read-only links so others can learn without editing.
        </p>
        <button
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-[10px] border text-[14px] font-medium text-[var(--accent-strong)]"
          style={{ borderColor: "var(--border)" }}
          type="button"
        >
          See how it works
        </button>
      </section>
    </div>
  );
}

function NavSectionTitle({ title }: { title: string }) {
  return <h2 className="text-[15px] font-semibold">{title}</h2>;
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
    disabled
        ? "text-muted cursor-default"
        : active
          ? ""
          : "text-soft hover:bg-[var(--surface-soft)]"
  }`;
  const content = (
    <>
      <span className="flex items-center gap-3">
        <span className={active ? "text-[var(--accent)]" : "text-muted"}>{icon}</span>
        {label}
      </span>
      <span className="badge-neutral">
        {count}
      </span>
    </>
  );

  if (disabled || !href) {
    return (
      <div
        className={className}
        style={active ? { backgroundColor: "var(--accent-soft)", color: "var(--accent-strong)" } : undefined}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      className={className}
      href={href}
      style={active ? { backgroundColor: "var(--accent-soft)", color: "var(--accent-strong)" } : undefined}
    >
      {content}
    </Link>
  );
}
