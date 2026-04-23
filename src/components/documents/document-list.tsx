import Link from "next/link";

type DocumentListItem = {
  id: string;
  title: string;
  originalName: string;
  createdAt: Date;
};

export function DocumentList({
  documents,
}: {
  documents: DocumentListItem[];
}) {
  if (documents.length === 0) {
    return (
      <section className="surface-card text-center">
        <p className="display-copy text-3xl font-semibold text-zinc-950">Your library is empty.</p>
        <p className="mt-3 text-sm leading-7 text-zinc-600">
          Upload one Markdown file to start reading, highlighting, and saving notes in context.
        </p>
        <Link className="button-primary mt-6" href="/documents/new">
          Upload your first document
        </Link>
      </section>
    );
  }

  return (
    <ul className="grid gap-4">
      {documents.map((document) => (
        <li key={document.id}>
          <Link
            className="surface-card group block transition duration-200 hover:-translate-y-0.5"
            href={`/documents/${document.id}`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">
                Added{" "}
                <time dateTime={document.createdAt.toISOString()}>
                  {document.createdAt.toLocaleDateString()}
                </time>
              </p>
              <span className="text-sm font-medium text-zinc-400 transition group-hover:text-zinc-700">
                Open
              </span>
            </div>
            <h2 className="display-copy mt-4 text-[2rem] font-semibold leading-[1.02] text-zinc-950">
              {document.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">{document.originalName}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
