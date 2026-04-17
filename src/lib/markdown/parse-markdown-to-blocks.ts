import { fromMarkdown } from "mdast-util-from-markdown";
import { toString } from "mdast-util-to-string";

export type ParsedBlock = {
  blockKey: string;
  sortOrder: number;
  kind: "heading" | "paragraph" | "list-item" | "blockquote" | "code";
  text: string;
};

type ParsedBlockKind = ParsedBlock["kind"];
type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
};
type ContainerKind = Extract<ParsedBlockKind, "list-item" | "blockquote">;

export function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const tree = fromMarkdown(markdown) as MdastNode;
  const visibleBlocks = collectVisibleBlocks(tree);
  const blockKeyCounts = new Map<string, number>();

  return visibleBlocks.map((block, sortOrder) => {
    const baseKey = `${block.kind}:${hashVisibleBlock(block.kind, block.text)}`;
    const duplicateCount = blockKeyCounts.get(baseKey) ?? 0;

    blockKeyCounts.set(baseKey, duplicateCount + 1);

    return {
      ...block,
      sortOrder,
      blockKey: duplicateCount === 0 ? baseKey : `${baseKey}:${duplicateCount + 1}`,
    };
  });
}

function collectVisibleBlocks(root: MdastNode): Array<Omit<ParsedBlock, "blockKey" | "sortOrder">> {
  const blocks: Array<Omit<ParsedBlock, "blockKey" | "sortOrder">> = [];

  walkNode(root, null, blocks);

  return blocks;
}

function walkNode(
  node: MdastNode,
  containerKind: ContainerKind | null,
  blocks: Array<Omit<ParsedBlock, "blockKey" | "sortOrder">>,
) {
  switch (node.type) {
    case "heading":
      pushBlock(blocks, "heading", toString(node));
      return;
    case "paragraph":
      pushBlock(blocks, containerKind ?? "paragraph", toString(node));
      return;
    case "code":
      pushBlock(blocks, "code", node.value ?? "");
      return;
    case "listItem":
      visitChildren(node, "list-item", blocks);
      return;
    case "blockquote":
      visitChildren(node, "blockquote", blocks);
      return;
    default:
      visitChildren(node, containerKind, blocks);
  }
}

function visitChildren(
  node: MdastNode,
  containerKind: ContainerKind | null,
  blocks: Array<Omit<ParsedBlock, "blockKey" | "sortOrder">>,
) {
  for (const child of node.children ?? []) {
    walkNode(child, containerKind, blocks);
  }
}

function pushBlock(
  blocks: Array<Omit<ParsedBlock, "blockKey" | "sortOrder">>,
  kind: ParsedBlockKind,
  text: string,
) {
  if (text.trim().length === 0) {
    return;
  }

  blocks.push({ kind, text });
}

function hashVisibleBlock(kind: ParsedBlockKind, text: string) {
  let hash = 2166136261;
  const input = `${kind}\0${text}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
