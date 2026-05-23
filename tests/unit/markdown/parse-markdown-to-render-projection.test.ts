import { describe, expect, it } from "vitest";
import { parseMarkdownToRenderProjection } from "@/lib/markdown/parse-markdown-to-render-projection";

describe("parseMarkdownToRenderProjection", () => {
  it("projects headings, list items, blockquotes, and mermaid code blocks with stable paths", () => {
    const blocks = parseMarkdownToRenderProjection(
      "# Title\n\n- alpha\n  - beta\n\n> gamma\n\n```mermaid\ngraph TD;\nA-->B;\n```",
    );

    expect(
      blocks.map(({ kind, text, blockPath, selectable, attrs }) => ({
        kind,
        text,
        blockPath,
        selectable,
        attrs,
      })),
    ).toEqual([
      {
        kind: "heading",
        text: "Title",
        blockPath: "0:heading",
        selectable: true,
        attrs: {
          depth: 1,
        },
      },
      {
        kind: "list-item",
        text: "alpha",
        blockPath: "1:list/0:listItem/0:paragraph",
        selectable: true,
        attrs: {
          ordered: false,
          listDepth: 1,
          listStart: null,
          blockquoteDepth: undefined,
          tableColumnAlign: null,
        },
      },
      {
        kind: "list-item",
        text: "beta",
        blockPath: "1:list/0:listItem/1:list/0:listItem/0:paragraph",
        selectable: true,
        attrs: {
          ordered: false,
          listDepth: 2,
          listStart: null,
          blockquoteDepth: undefined,
          tableColumnAlign: null,
        },
      },
      {
        kind: "blockquote",
        text: "gamma",
        blockPath: "2:blockquote/0:paragraph",
        selectable: true,
        attrs: {
          ordered: undefined,
          listDepth: undefined,
          listStart: undefined,
          blockquoteDepth: 1,
          tableColumnAlign: null,
        },
      },
      {
        kind: "code",
        text: "graph TD;\nA-->B;",
        blockPath: "3:code",
        selectable: false,
        attrs: {
          language: "mermaid",
        },
      },
    ]);
  });

  it("projects gfm table cells with alignment attrs", () => {
    const blocks = parseMarkdownToRenderProjection(
      "| left | center |\n| :--- | :----: |\n| alpha | beta |",
    );

    expect(
      blocks.map(({ kind, text, blockPath, attrs }) => ({
        kind,
        text,
        blockPath,
        attrs,
      })),
    ).toEqual([
      {
        kind: "table-cell",
        text: "left",
        blockPath: "0:table/0:tableRow/0:tableCell",
        attrs: {
          tableColumnAlign: "left",
        },
      },
      {
        kind: "table-cell",
        text: "center",
        blockPath: "0:table/0:tableRow/1:tableCell",
        attrs: {
          tableColumnAlign: "center",
        },
      },
      {
        kind: "table-cell",
        text: "alpha",
        blockPath: "0:table/1:tableRow/0:tableCell",
        attrs: {
          tableColumnAlign: "left",
        },
      },
      {
        kind: "table-cell",
        text: "beta",
        blockPath: "0:table/1:tableRow/1:tableCell",
        attrs: {
          tableColumnAlign: "center",
        },
      },
    ]);
  });

  it("keeps a paragraph block key stable when unrelated earlier content is inserted", () => {
    const originalBlocks = parseMarkdownToRenderProjection("alpha\n\nbeta");
    const shiftedBlocks = parseMarkdownToRenderProjection("# Title\n\nalpha\n\nbeta");

    const originalBeta = originalBlocks.find((block) => block.text === "beta");
    const shiftedBeta = shiftedBlocks.find((block) => block.text === "beta");

    expect(originalBeta?.kind).toBe("paragraph");
    expect(shiftedBeta?.kind).toBe("paragraph");
    expect(shiftedBeta?.blockKey).toBe(originalBeta?.blockKey);
  });

  it("excludes image alt text from visible text projection", () => {
    const [block] = parseMarkdownToRenderProjection("hello ![alt text](x.png) world");

    expect(block).toMatchObject({
      kind: "paragraph",
      text: "hello  world",
    });
  });
});
