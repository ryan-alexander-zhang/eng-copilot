import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootPage from "@/app/page";

describe("RootPage", () => {
  it("renders the product heading", async () => {
    render(await RootPage());
    expect(
      screen.getByRole("heading", { name: "Markdown Word Annotation" }),
    ).toBeInTheDocument();
  });
});
