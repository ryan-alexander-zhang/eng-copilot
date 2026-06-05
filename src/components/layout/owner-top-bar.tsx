import Link from "next/link";
import { Search } from "lucide-react";
import { UserMenu } from "./user-menu";

type OwnerTopBarProps = {
  activeTab: "annotations" | "documents" | "vocabulary" | "word-lists";
  showSearch?: boolean;
  userInitial: string;
};

export function OwnerTopBar({
  activeTab,
  showSearch = true,
  userInitial,
}: OwnerTopBarProps) {
  return (
    <header
      className="flex h-[72px] items-center justify-between border-b bg-[var(--surface-strong)] px-8"
      style={{ borderColor: "var(--border)" }}
    >
      <Link className="text-[23px] font-semibold tracking-[-0.05em]" href="/documents">
        eng-copilot
      </Link>

      <div className="text-soft flex items-center gap-7 text-[15px]">
        {showSearch ? (
          <button
            aria-label="Search"
            className="text-muted inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            type="button"
          >
            <Search className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        ) : null}
        <TopBarLink active={activeTab === "documents"} href="/documents">
          Documents
        </TopBarLink>
        <TopBarLink active={activeTab === "word-lists"} href="/word-lists">
          Word Lists
        </TopBarLink>
        <TopBarLink active={activeTab === "vocabulary"} href="/vocabulary">
          Vocabulary
        </TopBarLink>
        <TopBarLink active={activeTab === "annotations"} href="/annotations">
          Annotations
        </TopBarLink>
        <UserMenu userInitial={userInitial} />
      </div>
    </header>
  );
}

function TopBarLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: string;
}) {
  return (
    <Link
      className={`relative py-6 transition ${
        active ? "" : "text-soft hover:text-[var(--foreground)]"
      }`}
      href={href}
    >
      {children}
      <span
        className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "var(--accent)" }}
      />
    </Link>
  );
}
