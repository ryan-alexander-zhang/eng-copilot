import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

const processor = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdownAst(markdown: string): Root {
  return processor.parse(markdown) as Root;
}
