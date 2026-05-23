import type {
  ProjectionBlock,
  ProjectionBlockKind,
  ProjectionNodeDescriptor,
} from "@/lib/markdown/types";

export function buildRenderProjection(
  nodes: ProjectionNodeDescriptor[],
): ProjectionBlock[] {
  const blockKeyCounts = new Map<string, number>();

  return nodes.map((node, sortOrder) => {
    const baseKey = `${node.kind}:${hashVisibleBlock(node.kind, node.text)}`;
    const duplicateCount = blockKeyCounts.get(baseKey) ?? 0;

    blockKeyCounts.set(baseKey, duplicateCount + 1);

    return {
      ...node,
      sortOrder,
      blockKey:
        duplicateCount === 0 ? baseKey : `${baseKey}:${duplicateCount + 1}`,
    };
  });
}

function hashVisibleBlock(kind: ProjectionBlockKind, text: string) {
  let hash = 2166136261;
  const input = `${kind}\0${text}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
