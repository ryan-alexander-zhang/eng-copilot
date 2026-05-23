"use client";

import {
  createElement,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Properties, RootContent } from "hast";
import { getAnnotationColor } from "@/lib/annotations/presentation";
import type { BlockRun } from "@/lib/markdown/build-block-runs";

export function ProjectedInlineRenderer({
  activeAnnotationId,
  activeSearchMatchId,
  blockKey,
  nodes,
  onSelectAnnotation,
  runs,
}: {
  activeAnnotationId?: string | null;
  activeSearchMatchId?: string | null;
  blockKey: string;
  nodes: RootContent[];
  onSelectAnnotation?: (annotationId: string) => void;
  runs: BlockRun[];
}) {
  const state = {
    offset: 0,
    previousSearchMatchIds: [] as string[],
  };

  return (
    <>
      {renderNodes(nodes, {
        activeAnnotationId,
        activeSearchMatchId,
        blockKey,
        onSelectAnnotation,
        runs,
        state,
      })}
    </>
  );
}

function renderNodes(
  nodes: RootContent[],
  context: RenderContext,
  keyPrefix = "node",
): ReactNode[] {
  return nodes.flatMap((node, index) =>
    renderNode(node, context, `${keyPrefix}-${index}`),
  );
}

function renderNode(
  node: RootContent,
  context: RenderContext,
  key: string,
): ReactNode[] {
  if (node.type === "text") {
    return renderTextNode(node.value, context, key);
  }

  if (node.type !== "element") {
    return [];
  }

  if (node.tagName === "br") {
    return [<br key={key} />];
  }

  const Tag = node.tagName;
  const props = normalizeProperties(node.properties);
  const children = renderNodes(node.children, context, key);

  return [createElement(Tag, { ...props, key }, children)];
}

function renderTextNode(
  value: string,
  context: RenderContext,
  keyPrefix: string,
): ReactNode[] {
  if (value.length === 0) {
    return [];
  }

  const startOffset = context.state.offset;
  const endOffset = startOffset + value.length;

  context.state.offset = endOffset;

  return context.runs
    .filter((run) => run.startOffset < endOffset && startOffset < run.endOffset)
    .map((run, index) => {
      const sliceStart = Math.max(startOffset, run.startOffset);
      const sliceEnd = Math.min(endOffset, run.endOffset);
      const sliceText = value.slice(sliceStart - startOffset, sliceEnd - startOffset);
      const searchMatchId = run.searchMatchIds[0];
      const isInteractive = run.annotationIds.length > 0 && !!context.onSelectAnnotation;
      const isActiveSearchHit =
        !!context.activeSearchMatchId &&
        run.searchMatchIds.includes(context.activeSearchMatchId);
      const previousSliceIncludesActiveSearchHit =
        !!context.activeSearchMatchId &&
        context.state.previousSearchMatchIds.includes(context.activeSearchMatchId);

      context.state.previousSearchMatchIds = run.searchMatchIds;

      return (
        <span
          className={`rounded-[8px] px-[0.2rem] py-[0.08rem] transition ${
            isInteractive ? "cursor-pointer" : ""
          }`}
          data-annotation-ids={
            run.annotationIds.length > 0 ? run.annotationIds.join(",") : undefined
          }
          data-block-key={context.blockKey}
          data-highlight-terms={
            run.highlightTerms.length > 0 ? run.highlightTerms.join(",") : undefined
          }
          data-search-match-id={searchMatchId}
          data-slice-end={sliceEnd}
          data-slice-start={sliceStart}
          data-testid={
            isActiveSearchHit && !previousSliceIncludesActiveSearchHit
              ? "search-hit-active"
              : undefined
          }
          key={`${keyPrefix}-${index}-${sliceStart}-${sliceEnd}`}
          onClick={
            isInteractive
              ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  context.onSelectAnnotation?.(run.annotationIds[0]!);
                }
              : undefined
          }
          style={buildSliceStyle(
            run,
            context.activeAnnotationId,
            context.activeSearchMatchId,
          )}
          title={buildSliceTitle(run.highlightTerms, run.annotationIds) ?? undefined}
        >
          {sliceText}
        </span>
      );
    });
}

type RenderContext = {
  activeAnnotationId?: string | null;
  activeSearchMatchId?: string | null;
  blockKey: string;
  onSelectAnnotation?: (annotationId: string) => void;
  runs: BlockRun[];
  state: {
    offset: number;
    previousSearchMatchIds: string[];
  };
};

function buildSliceStyle(
  run: Pick<
    BlockRun,
    "highlightTerms" | "annotationIds" | "annotationColor" | "searchMatchIds"
  >,
  activeAnnotationId?: string | null,
  activeSearchMatchId?: string | null,
): CSSProperties | undefined {
  if (run.annotationIds.length > 0) {
    const isActive = !!activeAnnotationId && run.annotationIds.includes(activeAnnotationId);
    const color = getAnnotationColor(run.annotationColor);

    return {
      backgroundColor: isActive ? color.activeBackground : color.background,
      color: color.foreground,
      boxShadow: isActive
        ? `inset 0 0 0 1px ${color.activeRing}`
        : `inset 0 0 0 1px ${color.ring}`,
    };
  }

  if (activeSearchMatchId && run.searchMatchIds.includes(activeSearchMatchId)) {
    return {
      backgroundColor: "#FDE68A",
      color: "#92400E",
      boxShadow: "inset 0 0 0 1px #F59E0B",
    };
  }

  if (run.searchMatchIds.length > 0) {
    return {
      backgroundColor: "#FEF3C7",
      color: "#92400E",
    };
  }

  if (run.highlightTerms.length > 0) {
    return {
      backgroundColor: "#EAF3FF",
      color: "#2563EB",
    };
  }

  return undefined;
}

function buildSliceTitle(highlightTerms: string[], annotationIds: string[]) {
  const parts: string[] = [];

  if (highlightTerms.length > 0) {
    parts.push(`Highlights: ${highlightTerms.join(", ")}`);
  }

  if (annotationIds.length > 0) {
    parts.push(`Annotations: ${annotationIds.join(", ")}`);
  }

  return parts.length > 0 ? parts.join(" | ") : null;
}

function normalizeProperties(properties: Properties) {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      if (key === "className" && Array.isArray(value)) {
        return [key, value.join(" ")];
      }

      return [key, value];
    }),
  );
}
