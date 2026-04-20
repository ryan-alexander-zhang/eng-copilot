import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnnotationPanel } from "@/components/documents/annotation-panel";

afterEach(() => {
  cleanup();
});

describe("AnnotationPanel", () => {
  it("updates the end offset when the end block changes", () => {
    render(
      <AnnotationPanel
        blocks={[
          { blockKey: "paragraph:1", text: "hello world" },
          { blockKey: "paragraph:2", text: "hey" },
        ]}
        annotations={[]}
        createAction={vi.fn().mockResolvedValue(undefined)}
        updateAction={vi.fn().mockResolvedValue(undefined)}
        deleteAction={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByLabelText("End offset")).toHaveValue(11);

    fireEvent.change(screen.getByLabelText("End block"), {
      target: { value: "paragraph:2" },
    });

    expect(screen.getByLabelText("End offset")).toHaveValue(3);
  });
});
