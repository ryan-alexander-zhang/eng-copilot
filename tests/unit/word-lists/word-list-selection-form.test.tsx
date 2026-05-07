import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WordListSelectionForm } from "@/components/word-lists/word-list-selection-form";

afterEach(() => {
  cleanup();
});

describe("WordListSelectionForm", () => {
  it("uses fixed metadata columns so rows stay vertically aligned", () => {
    render(
      <WordListSelectionForm
        lists={[
          {
            description: "Core high-frequency vocabulary.",
            id: "cet4",
            isSelected: true,
            name: "CET4",
            syncedLabel: "Today, 10:24 AM",
            wordCount: 1200,
          },
          {
            description: "Extended academic vocabulary.",
            id: "toefl",
            isSelected: false,
            name: "TOEFL",
            syncedLabel: "May 18, 2025, 8:40 AM",
            wordCount: 3781,
          },
        ]}
        updateWordListsAction={vi.fn()}
      />,
    );

    const metadataGroup = screen.getAllByText("Words")[0]?.closest("dl");

    expect(metadataGroup).toHaveClass("xl:flex-none");
    expect(metadataGroup).toHaveClass("xl:w-[298px]");
    expect(metadataGroup).toHaveClass("xl:grid-cols-[110px_170px]");
  });

  it("updates the selected state immediately when a checkbox is clicked", () => {
    render(
      <WordListSelectionForm
        lists={[
          {
            description: "Core high-frequency vocabulary.",
            id: "cet4",
            isSelected: true,
            name: "CET4",
            syncedLabel: "Today",
            wordCount: 1200,
          },
          {
            description: "Extended academic vocabulary.",
            id: "cet6",
            isSelected: false,
            name: "CET6",
            syncedLabel: "Today",
            wordCount: 1800,
          },
        ]}
        updateWordListsAction={vi.fn()}
      />,
    );

    const cet4Checkbox = screen.getByRole("checkbox", { name: "CET4" });

    expect(cet4Checkbox).toBeChecked();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByTestId("word-list-option-cet4")).toHaveAttribute(
      "data-selected",
      "true",
    );

    fireEvent.click(cet4Checkbox);

    expect(cet4Checkbox).not.toBeChecked();
    expect(screen.getByText("0 selected")).toBeInTheDocument();
    expect(screen.getByTestId("word-list-option-cet4")).toHaveAttribute(
      "data-selected",
      "false",
    );
  });
});
