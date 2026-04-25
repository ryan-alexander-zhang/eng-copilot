import Link from "next/link";
import { Search } from "lucide-react";
import { UserMenu } from "./user-menu";

type OwnerTopBarProps = {
  activeTab: "annotations" | "documents" | "word-lists";
  userInitial: string;
};

export function OwnerTopBar({ activeTab, userInitial }: OwnerTopBarProps) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-[#E8EBF0] bg-white px-8">
      <Link className="text-[23px] font-semibold tracking-[-0.05em] text-[#111827]" href="/documents">
        eng-copilot
      </Link>

      <div className="flex items-center gap-7 text-[15px] text-[#374151]">
        <button
          aria-label="Search"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F3F4F6]"
          type="button"
        >
          <Search className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
        <TopBarLink active={activeTab === "documents"} href="/documents">
          Documents
        </TopBarLink>
        <TopBarLink active={activeTab === "word-lists"} href="/word-lists">
          Word Lists
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
        active ? "text-[#111827]" : "text-[#4B5563] hover:text-[#111827]"
      }`}
      href={href}
    >
      {children}
      <span
        className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#3B82F6] ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </Link>
  );
}
