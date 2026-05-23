import type {
  ProjectionBlockAttrs,
  ProjectionBlockKind,
  ProjectionNodeDescriptor,
} from "@/lib/markdown/types";

export type ProjectionMarkdownNode = {
  type: string;
  depth?: number;
  ordered?: boolean;
  start?: number | null;
  lang?: string | null;
  align?: Array<"left" | "center" | "right" | null> | null;
  children?: ProjectionMarkdownNode[];
  data?: {
    hProperties?: Record<string, unknown>;
  };
  value?: string;
};

type WalkContext = {
  blockquoteDepth: number;
  listDepth: number;
  ordered: boolean;
  listStart: number | null;
  tableColumnAlign: "left" | "center" | "right" | null;
};

export type ProjectionNodeVisit = ProjectionNodeDescriptor & {
  node: ProjectionMarkdownNode;
  parent: ProjectionMarkdownNode;
};

const ROOT_CONTEXT: WalkContext = {
  blockquoteDepth: 0,
  listDepth: 0,
  ordered: false,
  listStart: null,
  tableColumnAlign: null,
};

export function collectProjectionNodes(root: ProjectionMarkdownNode): ProjectionNodeDescriptor[] {
  const nodes: ProjectionNodeDescriptor[] = [];

  visitProjectionNodes(root, ({ blockPath, kind, text, selectable, attrs }) => {
    nodes.push({
      blockPath,
      kind,
      text,
      selectable,
      attrs,
    });
  });

  return nodes;
}

export function visitProjectionNodes(
  root: ProjectionMarkdownNode,
  visit: (input: ProjectionNodeVisit) => void,
) {
  visitChildren(root, "", ROOT_CONTEXT, visit);
}

function visitChildren(
  parent: ProjectionMarkdownNode,
  parentPath: string,
  context: WalkContext,
  visit: (input: ProjectionNodeVisit) => void,
) {
  for (const [index, child] of (parent.children ?? []).entries()) {
    const path = appendPath(parentPath, index, child.type);

    visitNode(child, path, context, parent, visit);
  }
}

function visitNode(
  node: ProjectionMarkdownNode,
  path: string,
  context: WalkContext,
  parent: ProjectionMarkdownNode,
  visit: (input: ProjectionNodeVisit) => void,
) {
  switch (node.type) {
    case "heading":
      emitProjectionNode(node, parent, visit, {
        blockPath: path,
        kind: "heading",
        text: collectVisibleText(node),
        selectable: true,
        attrs: {
          depth: node.depth,
        },
      });
      return;
    case "paragraph":
      emitProjectionNode(node, parent, visit, {
        blockPath: path,
        kind: resolveParagraphKind(context),
        text: collectVisibleText(node),
        selectable: true,
        attrs: buildParagraphAttrs(context),
      });
      return;
    case "code":
      emitProjectionNode(node, parent, visit, {
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
      emitProjectionNode(node, parent, visit, {
        blockPath: path,
        kind: "table-cell",
        text: collectVisibleText(node),
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
        visit,
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
        visit,
      );
      return;
    case "table":
      visitTable(node, path, context, visit);
      return;
    default:
      visitChildren(node, path, context, visit);
  }
}

function visitTable(
  tableNode: ProjectionMarkdownNode,
  tablePath: string,
  context: WalkContext,
  visit: (input: ProjectionNodeVisit) => void,
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
        row,
        visit,
      );
    }
  }
}

function appendPath(parentPath: string, index: number, nodeType: string) {
  const segment = `${index}:${nodeType}`;

  return parentPath.length === 0 ? segment : `${parentPath}/${segment}`;
}

function emitProjectionNode(
  node: ProjectionMarkdownNode,
  parent: ProjectionMarkdownNode,
  visit: (input: ProjectionNodeVisit) => void,
  descriptor: ProjectionNodeDescriptor,
) {
  if (descriptor.text.trim().length === 0) {
    return;
  }

  visit({
    ...descriptor,
    node,
    parent,
  });
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

function collectVisibleText(node: ProjectionMarkdownNode): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
      return node.value ?? "";
    case "break":
      return "\n";
    case "image":
    case "imageReference":
    case "html":
      return "";
    default:
      return (node.children ?? []).map((child) => collectVisibleText(child)).join("");
  }
}
