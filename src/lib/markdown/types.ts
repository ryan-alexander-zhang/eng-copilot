export type ProjectionBlockKind =
  | "heading"
  | "paragraph"
  | "list-item"
  | "blockquote"
  | "code"
  | "table-cell";

export type ProjectionBlockAttrs = {
  depth?: number;
  ordered?: boolean;
  listDepth?: number;
  listStart?: number | null;
  blockquoteDepth?: number;
  language?: string | null;
  tableColumnAlign?: "left" | "center" | "right" | null;
};

export type ProjectionBlock = {
  blockKey: string;
  blockPath: string;
  sortOrder: number;
  kind: ProjectionBlockKind;
  text: string;
  selectable: boolean;
  attrs: ProjectionBlockAttrs | null;
};

export type ProjectionNodeDescriptor = Omit<ProjectionBlock, "blockKey" | "sortOrder">;

export type ParsedBlock = ProjectionBlock;
