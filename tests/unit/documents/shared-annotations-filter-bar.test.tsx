import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SharedAnnotationsFilterBar } from "@/components/annotations/shared-annotations-filter-bar";

const replaceMock = vi.fn();
let mockedSearchParams = "";

vi.mock("next/navigation", () => ({
  usePathname: () => "/shared/share-token/annotations",
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

describe("SharedAnnotationsFilterBar", () => {
  const props = {
    color: "all",
    colors: [{ label: "All colors", value: "all" }],
    q: "",
    sort: "newest",
    type: "all",
    types: [{ label: "All types", value: "all" }],
    wordList: "all",
    wordLists: [{ label: "All word lists", value: "all" }],
  };

  it("does not replace the route on mount when the URL already matches the current filters", async () => {
    render(<SharedAnnotationsFilterBar {...props} />);

    await waitFor(() => {
      expect(replaceMock).not.toHaveBeenCalled();
    });
  });

  it("updates the route when the search query changes", async () => {
    render(<SharedAnnotationsFilterBar {...props} />);

    fireEvent.change(screen.getByPlaceholderText("Search annotations..."), {
      target: { value: "habit" },
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/shared/share-token/annotations?q=habit",
        { scroll: false },
      );
    });
  });

  it("updates the route when the sort changes", () => {
    render(<SharedAnnotationsFilterBar {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Newest first" }));
    fireEvent.click(screen.getByRole("option", { name: "Oldest first" }));

    expect(replaceMock).toHaveBeenCalledWith("/shared/share-token/annotations?sort=oldest", {
      scroll: false,
    });
  });
});
