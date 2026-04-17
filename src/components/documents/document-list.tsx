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
    return <p>No documents yet.</p>;
  }

  return (
    <ul>
      {documents.map((document) => (
        <li key={document.id}>
          <h2>{document.title}</h2>
          <p>{document.originalName}</p>
          <p>
            Uploaded{" "}
            <time dateTime={document.createdAt.toISOString()}>
              {document.createdAt.toLocaleDateString()}
            </time>
          </p>
        </li>
      ))}
    </ul>
  );
}
