import Link from "next/link";
import { FileText } from "lucide-react";

type OwnerDocumentsSidebarProps = {
  documents: Array<{
    id: string;
    title: string;
    dayLabel: string;
    readingMinutes: number;
    isActive?: boolean;
  }>;
  totalCount?: number;
  storage: {
    usedLabel: string;
    totalLabel: string;
    progress: number;
  };
};

export function OwnerDocumentsSidebar({
  documents,
  totalCount,
  storage,
}: OwnerDocumentsSidebarProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#111827]">My Documents</h2>
          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[12px] font-semibold text-[#6B7280]">
            {totalCount ?? documents.length}
          </span>
        </div>
        <div className="mt-4 space-y-1.5">
          {documents.map((document) => (
            <Link
              className={`flex items-start gap-3 rounded-[12px] px-3 py-3 transition ${
                document.isActive
                  ? "border border-[#DDEAFE] bg-[#F5F9FF]"
                  : "border border-transparent hover:bg-[#F8FAFC]"
              }`}
              href={`/documents/${document.id}`}
              key={document.id}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full ${
                  document.isActive ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#F3F4F6] text-[#9CA3AF]"
                }`}
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p
                  className={`truncate text-[14px] font-medium ${
                    document.isActive ? "text-[#2563EB]" : "text-[#374151]"
                  }`}
                >
                  {document.title}.md
                </p>
                <p className="mt-1 text-[12px] text-[#9CA3AF]">
                  {document.dayLabel} • {document.readingMinutes} min read
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Link
        className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#E5E7EB] text-[14px] font-medium text-[#4B5563] transition hover:bg-[#F9FAFB]"
        href="/documents"
      >
        View all documents
        <span>→</span>
      </Link>

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
    </div>
  );
}
