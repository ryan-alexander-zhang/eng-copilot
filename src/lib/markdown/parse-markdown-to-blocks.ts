import { fromMarkdown } from "mdast-util-from-markdown";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

export type ParsedBlock = {
  blockKey: string;
  sortOrder: number;
  kind: "heading" | "paragraph" | "list-item" | "blockquote" | "code";
  text: string;
};

export function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const tree = fromMarkdown(markdown);
  const blocks: ParsedBlock[] = [];
  let index = 0;

  visit(tree, (node) => {
    if (
      node.type === "heading" ||
      node.type === "paragraph" ||
      node.type === "listItem" ||
      node.type === "blockquote" ||
      node.type === "code"
    ) {
      const kind =
        node.type === "listItem"
          ? "list-item"
          : (node.type as ParsedBlock["kind"]);

      blocks.push({
        blockKey: `${kind}:${index}`,
        sortOrder: index,
        kind,
        text: toString(node),
      });
      index += 1;
    }
  });

  return blocks.filter((block) => block.text.trim().length > 0);
}
