import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VocabularyDisclosure } from "@/components/vocabulary/vocabulary-disclosure";

afterEach(() => {
  cleanup();
});

describe("VocabularyDisclosure", () => {
  it("renders open content outside the parent scroll container", async () => {
    const { container } = render(
      <div className="overflow-x-auto" data-testid="scroll-host">
        <VocabularyDisclosure className="relative" trigger="Edit" triggerClassName="button">
          <form className="absolute right-0 top-11">
            <button type="submit">Save changes</button>
          </form>
        </VocabularyDisclosure>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const saveButton = await screen.findByRole("button", { name: "Save changes" });

    expect(container).not.toContainElement(saveButton);
    expect(saveButton.closest("form")?.parentElement).toHaveStyle({ position: "fixed" });
  });

  it("closes when a nested form submits", () => {
    render(
      <VocabularyDisclosure className="relative" trigger="Edit" triggerClassName="button">
        <form>
          <button type="submit">Save changes</button>
        </form>
      </VocabularyDisclosure>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();

    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form")!);

    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });
});
