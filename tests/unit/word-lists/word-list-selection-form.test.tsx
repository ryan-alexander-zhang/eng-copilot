import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WordListSelectionForm } from "@/components/word-lists/word-list-selection-form";

describe("WordListSelectionForm", () => {
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
