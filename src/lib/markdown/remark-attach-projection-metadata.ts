import type { Root } from "mdast";
import {
  type ProjectionMarkdownNode,
  visitProjectionNodes,
} from "@/lib/markdown/collect-projection-nodes";
import type { ProjectionBlock } from "@/lib/markdown/types";

export type AttachmentResult = {
  attachedBlockPaths: string[];
  missingRuntimePaths: string[];
  unmatchedBlockPaths: string[];
};

export function remarkAttachProjectionMetadata(options: {
  blocks: ProjectionBlock[];
}) {
  return function transform(tree: Root) {
    attachProjectionMetadata(tree as ProjectionMarkdownNode, options.blocks);
  };
}

export function attachProjectionMetadata(
  tree: ProjectionMarkdownNode,
  blocks: ProjectionBlock[],
): AttachmentResult {
  const blocksByPath = new Map(
    blocks.map((block) => [block.blockPath, block] as const),
  );
  const attachedBlockPaths = new Set<string>();
  const missingRuntimePaths: string[] = [];

  visitProjectionNodes(tree, ({ blockPath, kind, node, parent }) => {
    const block = blocksByPath.get(blockPath);

    if (!block || block.kind !== kind) {
      missingRuntimePaths.push(blockPath);
      return;
    }

    attachBlockMetadata(node, block);

    if (block.kind === "list-item" && parent.type === "listItem") {
      attachBlockMetadata(parent, block);
    }

    attachedBlockPaths.add(blockPath);
  });

  return {
    attachedBlockPaths: [...attachedBlockPaths],
    missingRuntimePaths,
    unmatchedBlockPaths: blocks
      .map((block) => block.blockPath)
      .filter((blockPath) => !attachedBlockPaths.has(blockPath)),
  };
}

function attachBlockMetadata(node: ProjectionMarkdownNode, block: ProjectionBlock) {
  node.data ??= {};
  node.data.hProperties = {
    ...node.data.hProperties,
    "data-block-key": block.blockKey,
    "data-block-kind": block.kind,
    "data-block-path": block.blockPath,
    "data-selectable-block": block.selectable ? "1" : "0",
  };
}
