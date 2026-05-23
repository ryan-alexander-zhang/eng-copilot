import { toString } from "mdast-util-to-string";
import type {
  ProjectionBlockAttrs,
  ProjectionBlockKind,
  ProjectionNodeDescriptor,
} from "@/lib/markdown/types";

type MarkdownNode = {
  type: string;
  depth?: number;
  ordered?: boolean;
  start?: number | null;
  lang?: string | null;
  align?: Array<"left" | "center" | "right" | null> | null;
  children?: MarkdownNode[];
  value?: string;
};

type WalkContext = {
  blockquoteDepth: number;
  listDepth: number;
  ordered: boolean;
  listStart: number | null;
  tableColumnAlign: "left" | "center" | "right" | null;
};

const ROOT_CONTEXT: WalkContext = {
  blockquoteDepth: 0,
  listDepth: 0,
  ordered: false,
  listStart: null,
  tableColumnAlign: null,
};

export function collectProjectionNodes(root: MarkdownNode): ProjectionNodeDescriptor[] {
  const nodes: ProjectionNodeDescriptor[] = [];

  visitChildren(root, "", ROOT_CONTEXT, nodes);

  return nodes;
}

function visitChildren(
  parent: MarkdownNode,
  parentPath: string,
  context: WalkContext,
  nodes: ProjectionNodeDescriptor[],
) {
  for (const [index, child] of (parent.children ?? []).entries()) {
    const path = appendPath(parentPath, index, child.type);

    visitNode(child, path, context, nodes);
  }
}

function visitNode(
  node: MarkdownNode,
  path: string,
  context: WalkContext,
  nodes: ProjectionNodeDescriptor[],
) {
  switch (node.type) {
    case "heading":
      pushNode(nodes, {
        blockPath: path,
        kind: "heading",
        text: toString(node),
        selectable: true,
        attrs: {
          depth: node.depth,
        },
      });
      return;
    case "paragraph":
      pushNode(nodes, {
        blockPath: path,
        kind: resolveParagraphKind(context),
        text: toString(node),
        selectable: true,
        attrs: buildParagraphAttrs(context),
      });
      return;
    case "code":
      pushNode(nodes, {
        blockPath: path,
        kind: "code",
        text: node.value ?? "",
        selectable: (node.lang ?? "").toLowerCase() !== "mermaid",
        attrs: {
          language: node.lang ?? null,
        },
      });
      return;
    case "tableCell":
      pushNode(nodes, {
        blockPath: path,
        kind: "table-cell",
        text: toString(node),
        selectable: true,
        attrs: {
          tableColumnAlign: context.tableColumnAlign,
        },
      });
      return;
    case "blockquote":
      visitChildren(
        node,
        path,
        {
          ...context,
          blockquoteDepth: context.blockquoteDepth + 1,
        },
        nodes,
      );
      return;
    case "list":
      visitChildren(
        node,
        path,
        {
          ...context,
          listDepth: context.listDepth + 1,
          ordered: Boolean(node.ordered),
          listStart: node.start ?? null,
        },
        nodes,
      );
      return;
    case "table":
      visitTable(node, path, context, nodes);
      return;
    default:
      visitChildren(node, path, context, nodes);
  }
}

function visitTable(
  tableNode: MarkdownNode,
  tablePath: string,
  context: WalkContext,
  nodes: ProjectionNodeDescriptor[],
) {
  for (const [rowIndex, row] of (tableNode.children ?? []).entries()) {
    const rowPath = appendPath(tablePath, rowIndex, row.type);

    for (const [cellIndex, cell] of (row.children ?? []).entries()) {
      const cellPath = appendPath(rowPath, cellIndex, cell.type);

      visitNode(
        cell,
        cellPath,
        {
          ...context,
          tableColumnAlign: tableNode.align?.[cellIndex] ?? null,
        },
        nodes,
      );
    }
  }
}

function appendPath(parentPath: string, index: number, nodeType: string) {
  const segment = `${index}:${nodeType}`;

  return parentPath.length === 0 ? segment : `${parentPath}/${segment}`;
}

function pushNode(nodes: ProjectionNodeDescriptor[], node: ProjectionNodeDescriptor) {
  if (node.text.trim().length === 0) {
    return;
  }

  nodes.push(node);
}

function resolveParagraphKind(context: WalkContext): ProjectionBlockKind {
  if (context.listDepth > 0) {
    return "list-item";
  }

  if (context.blockquoteDepth > 0) {
    return "blockquote";
  }

  return "paragraph";
}

function buildParagraphAttrs(context: WalkContext): ProjectionBlockAttrs | null {
  if (
    context.listDepth === 0 &&
    context.blockquoteDepth === 0 &&
    context.tableColumnAlign == null
  ) {
    return null;
  }

  return {
    ordered: context.listDepth > 0 ? context.ordered : undefined,
    listDepth: context.listDepth > 0 ? context.listDepth : undefined,
    listStart: context.listDepth > 0 ? context.listStart : undefined,
    blockquoteDepth:
      context.blockquoteDepth > 0 ? context.blockquoteDepth : undefined,
    tableColumnAlign: context.tableColumnAlign,
  };
}
