import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnnotationsFilterBar } from "@/components/annotations/annotations-filter-bar";

const replaceMock = vi.fn();
let mockedSearchParams = "";

vi.mock("next/navigation", () => ({
  usePathname: () => "/annotations",
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams(mockedSearchParams),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockedSearchParams = "";
  replaceMock.mockReset();
});

describe("AnnotationsFilterBar", () => {
  const props = {
    color: "all",
    colors: [{ label: "All colors", value: "all" }],
    document: "all",
    documents: [
      { label: "The Value of Long Form Reading", value: "doc_1" },
      { label: "How to Build a Better Habit System", value: "doc_2" },
    ],
    q: "",
    sort: "newest",
    type: "all",
    types: [{ label: "All types", value: "all" }],
    wordList: "all",
    wordLists: [{ label: "All word lists", value: "all" }],
  };

  it("updates the route when the sort changes", () => {
    render(<AnnotationsFilterBar {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Newest first" }));
    fireEvent.click(screen.getByRole("option", { name: "Oldest first" }));

    expect(replaceMock).toHaveBeenCalledWith("/annotations?sort=oldest", {
      scroll: false,
    });
  });

  it("renders a wider, hoverable document selector for long document names", () => {
    render(<AnnotationsFilterBar {...props} document="doc_1" />);

    const documentButton = screen.getByRole("button", {
      name: "The Value of Long Form Reading",
    });

    expect(documentButton.parentElement).toHaveClass("min-w-[240px]", "xl:min-w-[280px]");
    expect(documentButton).toHaveAttribute("title", "The Value of Long Form Reading");

    fireEvent.click(documentButton);

    expect(
      screen.getByRole("option", { name: "How to Build a Better Habit System" }),
    ).toHaveAttribute("title", "How to Build a Better Habit System");
  });
});
