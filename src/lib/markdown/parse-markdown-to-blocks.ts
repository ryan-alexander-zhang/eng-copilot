import { parseMarkdownToRenderProjection } from "@/lib/markdown/parse-markdown-to-render-projection";
import type { ParsedBlock } from "@/lib/markdown/types";

export type { ParsedBlock } from "@/lib/markdown/types";

export function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  return parseMarkdownToRenderProjection(markdown);
}
