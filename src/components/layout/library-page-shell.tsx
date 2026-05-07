import type { ReactNode } from "react";
import { DocumentUploadSidebar } from "@/components/layout/document-upload-sidebar";
import {
  LibraryNavSidebar,
  type LibraryNavItem,
} from "@/components/layout/library-nav-sidebar";
import { OwnerTopBar } from "@/components/layout/owner-top-bar";

type LibraryPageShellProps = {
  activeItem: LibraryNavItem;
  children: ReactNode;
  counts: {
    documents: number;
    readOnlyLinks: number;
    sharedWithMe: number;
    trash: number;
  };
  storage: {
    progress: number;
    totalLabel: string;
    usedLabel: string;
  };
  userInitial: string;
};

export function LibraryPageShell({
  activeItem,
  children,
  counts,
  storage,
  userInitial,
}: LibraryPageShellProps) {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto overflow-hidden rounded-[28px] border border-[#E8EBF0] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <OwnerTopBar activeTab="documents" userInitial={userInitial} />

        <div className="flex min-h-[calc(100vh-72px)]">
          <aside className="w-full max-w-[296px] border-r border-[#E8EBF0] bg-white px-6 py-6">
            <DocumentUploadSidebar />
            <div className="mt-6">
              <LibraryNavSidebar activeItem={activeItem} counts={counts} storage={storage} />
            </div>
          </aside>

          <section className="min-w-0 flex-1 px-9 py-9">{children}</section>
        </div>
      </div>
    </main>
  );
}
