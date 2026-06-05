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
    <main className="app-shell">
      <div className="app-frame">
        <OwnerTopBar activeTab="documents" userInitial={userInitial} />

        <div className="flex min-h-[calc(100vh-72px)]">
          <aside className="app-sidebar w-full max-w-[296px] px-6 py-6">
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
