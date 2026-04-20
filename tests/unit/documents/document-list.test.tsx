import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentList } from "@/components/documents/document-list";

afterEach(() => {
  cleanup();
});

describe("DocumentList", () => {
  it("links document titles to the reader page", () => {
    render(
      <DocumentList
        documents={[
          {
            id: "doc_123",
            title: "Quarterly Report",
            originalName: "report.md",
            createdAt: new Date("2026-04-20T00:00:00.000Z"),
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Quarterly Report" })).toHaveAttribute(
      "href",
      "/documents/doc_123",
    );
  });
});
