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
          <h2 className="text-[15px] font-semibold">My Documents</h2>
          <span className="badge-neutral">
            {totalCount ?? documents.length}
          </span>
        </div>
        <div className="mt-4 space-y-1.5">
          {documents.map((document) => (
            <Link
              className={`flex items-start gap-3 rounded-[12px] px-3 py-3 transition ${
                document.isActive
                  ? "border"
                  : "border border-transparent hover:bg-[var(--surface-soft)]"
              }`}
              href={`/documents/${document.id}`}
              key={document.id}
              style={
                document.isActive
                  ? {
                      borderColor: "var(--border)",
                      backgroundColor: "var(--accent-soft)",
                    }
                  : undefined
              }
            >
              <div
                className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full ${
                  document.isActive
                    ? "bg-[var(--surface-strong)] text-[var(--accent)]"
                    : "icon-chip-neutral"
                }`}
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p
                  className={`truncate text-[14px] font-medium ${
                    document.isActive ? "text-[var(--accent-strong)]" : "text-soft"
                  }`}
                >
                  {document.title}
                </p>
                <p className="text-muted mt-1 text-[12px]">
                  {document.dayLabel} • {document.readingMinutes} min read
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Link
        className="text-soft inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border text-[14px] font-medium transition hover:bg-[var(--surface-soft)]"
        href="/documents"
        style={{ borderColor: "var(--border)" }}
      >
        View all documents
        <span>→</span>
      </Link>

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
    </div>
  );
}
