export type ProjectionBlockKind =
  | "heading"
  | "paragraph"
  | "list-item"
  | "blockquote"
  | "code"
  | "table-cell"
  | "pdf-page";

export type ProjectionBlockAttrs = {
  depth?: number;
  ordered?: boolean;
  listDepth?: number;
  listStart?: number | null;
  blockquoteDepth?: number;
  language?: string | null;
  tableColumnAlign?: "left" | "center" | "right" | null;
  pageNumber?: number;
  width?: number;
  height?: number;
  rotation?: number;
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

export type PdfAnnotationRect = {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PdfAnnotationAnchor = {
  kind: "pdf-page-text-v1";
  startPageNumber: number;
  startRunIndex: number;
  endPageNumber: number;
  endRunIndex: number;
  rects: PdfAnnotationRect[];
};
