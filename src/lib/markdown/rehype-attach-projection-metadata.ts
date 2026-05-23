import type { Element, Parent, Root, RootContent } from "hast";
import { visit } from "unist-util-visit";
import type { ProjectionBlock, ProjectionBlockKind } from "@/lib/markdown/types";

type RuntimeBlockSurface = {
  kind: ProjectionBlockKind;
  text: string;
};

export function rehypeAttachProjectionMetadata(options: {
  blocks: ProjectionBlock[];
}) {
  return function transform(tree: Root) {
    attachProjectionMetadata(tree, options.blocks);
  };
}

export function attachProjectionMetadata(tree: Root, blocks: ProjectionBlock[]) {
  let blockIndex = 0;

  visit(tree, "element", (node, _index, parent) => {
    const surface = describeRuntimeBlockSurface(node, parent);

    if (!surface) {
      return;
    }

    const block = blocks[blockIndex];

    if (!block) {
      return;
    }

    if (
      block.kind !== surface.kind ||
      normalizeVisibleText(block.text) !== normalizeVisibleText(surface.text)
    ) {
      return;
    }

    node.properties = {
      ...node.properties,
      "data-block-key": block.blockKey,
      "data-block-kind": block.kind,
      "data-block-path": block.blockPath,
      "data-selectable-block": block.selectable ? "1" : "0",
    };
    blockIndex += 1;
  });

  return blockIndex;
}

function describeRuntimeBlockSurface(
  node: Element,
  parent: Parent | undefined,
): RuntimeBlockSurface | null {
  if (isHeading(node.tagName)) {
    return {
      kind: "heading",
      text: collectVisibleText(node),
    };
  }

  if (node.tagName === "p") {
    if (isParentElement(parent, "blockquote")) {
      return {
        kind: "blockquote",
        text: collectVisibleText(node),
      };
    }

    if (isParentElement(parent, "li")) {
      return {
        kind: "list-item",
        text: collectVisibleText(node),
      };
    }

    return {
      kind: "paragraph",
      text: collectVisibleText(node),
    };
  }

  if (node.tagName === "li" && !hasDirectParagraphChild(node)) {
    return {
      kind: "list-item",
      text: collectTightListItemText(node),
    };
  }

  if (node.tagName === "code" && isParentElement(parent, "pre")) {
    return {
      kind: "code",
      text: normalizeCodeBlockText(collectVisibleText(node)),
    };
  }

  if (node.tagName === "td" || node.tagName === "th") {
    return {
      kind: "table-cell",
      text: collectVisibleText(node),
    };
  }

  return null;
}

function collectVisibleText(node: RootContent | Element): string {
  if (node.type === "text") {
    return node.value;
  }

  if (node.type !== "element") {
    return "";
  }

  if (node.tagName === "br") {
    return "\n";
  }

  if (node.tagName === "img" || node.tagName === "input") {
    return "";
  }

  return node.children.map((child) => collectVisibleText(child)).join("");
}

function collectTightListItemText(node: Element) {
  return node.children
    .filter((child) => !isElementTag(child, "ul") && !isElementTag(child, "ol"))
    .map((child) => collectVisibleText(child))
    .join("");
}

function hasDirectParagraphChild(node: Element) {
  return node.children.some((child) => isElementTag(child, "p"));
}

function isParentElement(parent: Parent | undefined, tagName: string): parent is Element {
  return parent?.type === "element" && parent.tagName === tagName;
}

function isElementTag(
  node: RootContent | undefined,
  tagName: string,
): node is Element {
  return node?.type === "element" && node.tagName === tagName;
}

function isHeading(tagName: string) {
  return /^h[1-6]$/.test(tagName);
}

function normalizeVisibleText(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

function normalizeCodeBlockText(value: string) {
  return normalizeVisibleText(value).replace(/\n$/, "");
}
