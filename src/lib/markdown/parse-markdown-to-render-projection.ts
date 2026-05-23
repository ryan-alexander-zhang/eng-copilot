import { buildRenderProjection } from "@/lib/markdown/build-render-projection";
import { collectProjectionNodes } from "@/lib/markdown/collect-projection-nodes";
import { parseMarkdownAst } from "@/lib/markdown/parse-markdown-ast";
import type { ProjectionBlock } from "@/lib/markdown/types";

export function parseMarkdownToRenderProjection(
  markdown: string,
): ProjectionBlock[] {
  const tree = parseMarkdownAst(markdown);
  const nodes = collectProjectionNodes(tree as never);

  return buildRenderProjection(nodes);
}
