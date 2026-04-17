import "@testing-library/jest-dom/vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout from "@/app/layout";
import RootPage from "@/app/page";

describe("RootPage", () => {
  it("renders the app shell through the root layout", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <RootPage />
      </RootLayout>,
    );

    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<body>");
    expect(html).toContain("<main>");
    expect(html).toContain("Markdown Word Annotation");
    expect(html).toContain(
      "Upload Markdown, highlight vocabulary, annotate text, and share read-only study views.",
    );
  });
});
