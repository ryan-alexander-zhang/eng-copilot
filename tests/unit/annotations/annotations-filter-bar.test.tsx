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
    documents: [{ label: "All documents", value: "all" }],
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
});
