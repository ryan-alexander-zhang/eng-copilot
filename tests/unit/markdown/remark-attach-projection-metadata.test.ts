import { describe, expect, it } from "vitest";
import { parseMarkdownAst } from "@/lib/markdown/parse-markdown-ast";
import type { ProjectionMarkdownNode } from "@/lib/markdown/collect-projection-nodes";
import { parseMarkdownToRenderProjection } from "@/lib/markdown/parse-markdown-to-render-projection";
import { attachProjectionMetadata } from "@/lib/markdown/remark-attach-projection-metadata";

describe("attachProjectionMetadata", () => {
  it("attaches persisted metadata to runtime nodes by block path", () => {
    const markdown = "# Title\n\n- alpha\n\n```mermaid\ngraph TD;\nA-->B;\n```\n\n| left |\n| --- |\n| beta |";
    const tree = parseMarkdownAst(markdown) as unknown as ProjectionMarkdownNode;
    const blocks = parseMarkdownToRenderProjection(markdown);

    const result = attachProjectionMetadata(tree, blocks);

    expect(result.missingRuntimePaths).toEqual([]);
    expect(result.unmatchedBlockPaths).toEqual([]);

    for (const block of blocks) {
      const node = getNodeByPath(tree, block.blockPath);

      expect(node.data?.hProperties).toMatchObject({
        "data-block-key": block.blockKey,
        "data-block-kind": block.kind,
        "data-block-path": block.blockPath,
        "data-selectable-block": block.selectable ? "1" : "0",
      });
    }

    const listBlock = blocks.find((block) => block.kind === "list-item");
    const listItemNode = getNodeByPath(tree, "1:list/0:listItem");

    expect(listBlock).toBeDefined();
    expect(listItemNode.data?.hProperties).toMatchObject({
      "data-block-key": listBlock?.blockKey,
      "data-block-path": listBlock?.blockPath,
    });
  });

  it("reports projection drift when runtime topology no longer matches persisted blocks", () => {
    const tree = parseMarkdownAst("# Title\n\n- alpha") as unknown as ProjectionMarkdownNode;
    const blocks = parseMarkdownToRenderProjection("# Title\n\nParagraph");

    const result = attachProjectionMetadata(tree, blocks);

    expect(result.missingRuntimePaths).toEqual(["1:list/0:listItem/0:paragraph"]);
    expect(result.unmatchedBlockPaths).toEqual(["1:paragraph"]);
  });
});

function getNodeByPath(root: ProjectionMarkdownNode, blockPath: string) {
  let current = root;

  for (const segment of blockPath.split("/")) {
    const index = Number(segment.split(":")[0]);

    current = current.children?.[index] as ProjectionMarkdownNode;
  }

  return current;
}
