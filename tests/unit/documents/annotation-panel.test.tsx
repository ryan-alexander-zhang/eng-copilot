import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnnotationPanel } from "@/components/documents/annotation-panel";

afterEach(() => {
  cleanup();
});

describe("AnnotationPanel", () => {
  it("renders an empty-state message when no annotations exist", () => {
    render(
      <AnnotationPanel annotations={[]} onSelectAnnotation={vi.fn()} variant="detailed" />,
    );

    expect(screen.getByText("No annotations yet.")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveDisplayValue("All annotations");
  });

  it("renders selectable summaries for existing annotations", () => {
    const onSelectAnnotation = vi.fn();

    render(
      <AnnotationPanel
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: "paragraph:1",
            startOffset: 0,
            endBlockKey: "paragraph:1",
            endOffset: 7,
            quote: "ability",
            note: "Owner note for shared viewer.",
            color: "yellow",
            tags: [],
            createdAt: new Date("2026-04-22T00:00:00.000Z"),
            updatedAt: new Date("2026-04-22T00:00:00.000Z"),
          },
        ]}
        onSelectAnnotation={onSelectAnnotation}
        selectedAnnotationId="annotation-1"
        variant="compact"
      />,
    );

    expect(screen.getByText("Owner note for shared viewer.")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    screen.getByRole("button", { name: /Owner note for shared viewer\./ }).click();
    expect(onSelectAnnotation).toHaveBeenCalledWith("annotation-1");
  });

  it("renders read-only notes for shared readers", () => {
    render(
      <AnnotationPanel
        annotations={[
          {
            id: "annotation-1",
            startBlockKey: "paragraph:1",
            startOffset: 0,
            endBlockKey: "paragraph:1",
            endOffset: 7,
            quote: "ability",
            note: "Shared readers should see this note.",
            color: "yellow",
            tags: [],
            createdAt: new Date("2026-04-22T00:00:00.000Z"),
            updatedAt: new Date("2026-04-22T00:00:00.000Z"),
          },
        ]}
        readOnly
        variant="compact"
      />,
    );

    expect(screen.getByText("Shared readers should see this note.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
