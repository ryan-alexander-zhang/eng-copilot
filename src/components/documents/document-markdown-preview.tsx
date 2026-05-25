"use client";

import type { Element, RootContent } from "hast";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Children, createElement, isValidElement } from "react";
import Markdown, { type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidBlock } from "@/components/documents/mermaid-block";
import { ProjectedInlineRenderer } from "@/components/documents/projected-inline-renderer";
import type { BlockRun } from "@/lib/markdown/build-block-runs";
import { buildBlockRuns } from "@/lib/markdown/build-block-runs";
import { remarkAttachProjectionMetadata } from "@/lib/markdown/remark-attach-projection-metadata";
import type { ProjectionBlockAttrs } from "@/lib/markdown/types";

type PreviewBlock = {
  blockKey: string;
  blockPath?: string;
  kind?: string;
  selectable?: boolean;
  attrs?: ProjectionBlockAttrs | null;
  text: string;
};

type AnnotationSegment = {
  annotationId: string;
  color?: string | null;
  startOffset: number;
  endOffset: number;
};

type SearchMatch = {
  id: string;
  blockKey: string;
  startOffset: number;
  endOffset: number;
};

type HighlightMatch = {
  blockKey: string;
  startOffset: number;
  endOffset: number;
  term: string;
};

const VOID_HTML_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export function DocumentMarkdownPreview({
  activeAnnotationId,
  activeSearchMatchId,
  blocks,
  hiddenBlockKeys,
  highlightMatchesByBlock,
  annotationSegmentsByBlock,
  onSelectAnnotation,
  rawMarkdown,
  searchMatchesByBlock,
}: {
  activeAnnotationId?: string | null;
  activeSearchMatchId?: string | null;
  annotationSegmentsByBlock: Record<string, AnnotationSegment[]>;
  blocks: PreviewBlock[];
  hiddenBlockKeys?: Set<string>;
  highlightMatchesByBlock: Record<string, HighlightMatch[]>;
  onSelectAnnotation?: (annotationId: string) => void;
  rawMarkdown: string;
  searchMatchesByBlock: Record<string, SearchMatch[]>;
}) {
  const blocksByKey = new Map(blocks.map((block) => [block.blockKey, block] as const));
  const runsByBlockKey = Object.fromEntries(
    blocks.map((block) => [
      block.blockKey,
      buildPreviewRuns({
        block,
        highlightMatches: highlightMatchesByBlock[block.blockKey] ?? [],
        annotationSegments: annotationSegmentsByBlock[block.blockKey] ?? [],
        searchMatches: searchMatchesByBlock[block.blockKey] ?? [],
      }),
    ]),
  ) as Record<string, BlockRun[]>;

  return (
    <Markdown
      components={buildComponents({
        activeAnnotationId,
        activeSearchMatchId,
        blocksByKey,
        hiddenBlockKeys,
        onSelectAnnotation,
        runsByBlockKey,
      })}
      remarkPlugins={[remarkGfm, [remarkAttachProjectionMetadata, { blocks }]]}
      skipHtml
    >
      {rawMarkdown}
    </Markdown>
  );
}

function buildComponents(input: {
  activeAnnotationId?: string | null;
  activeSearchMatchId?: string | null;
  blocksByKey: Map<string, PreviewBlock>;
  hiddenBlockKeys?: Set<string>;
  onSelectAnnotation?: (annotationId: string) => void;
  runsByBlockKey: Record<string, BlockRun[]>;
}) {
  const renderProjectedElement = (
    tagName: string,
    props: BlockComponentProps,
    className?: string,
  ) => {
    const metadata = getBlockMetadata(props.node);

    if (!metadata) {
      return createElementWithChildren(tagName, props, className);
    }

    if (input.hiddenBlockKeys?.has(metadata.blockKey)) {
      return null;
    }

    const block = input.blocksByKey.get(metadata.blockKey);

    if (!block) {
      return createElementWithChildren(tagName, props, className);
    }

    if (block.selectable === false) {
      return createElementWithChildren(tagName, props, className);
    }

    return createElementWithChildren(
      tagName,
      props,
      className,
      <ProjectedInlineRenderer
        activeAnnotationId={input.activeAnnotationId}
        activeSearchMatchId={input.activeSearchMatchId}
        blockKey={metadata.blockKey}
        nodes={props.node?.children ?? []}
        onSelectAnnotation={input.onSelectAnnotation}
        runs={input.runsByBlockKey[metadata.blockKey] ?? []}
      />,
    );
  };

  return {
    h1: (props: ComponentPropsWithoutRef<"h1"> & ExtraProps) =>
      renderProjectedElement("h1", props, "mt-10 text-[28px] font-semibold leading-10 text-[#111827]"),
    h2: (props: ComponentPropsWithoutRef<"h2"> & ExtraProps) =>
      renderProjectedElement("h2", props, "mt-10 text-[24px] font-semibold leading-10 text-[#111827]"),
    h3: (props: ComponentPropsWithoutRef<"h3"> & ExtraProps) =>
      renderProjectedElement("h3", props, "mt-8 text-[21px] font-semibold leading-9 text-[#111827]"),
    h4: (props: ComponentPropsWithoutRef<"h4"> & ExtraProps) =>
      renderProjectedElement("h4", props, "mt-8 text-[19px] font-semibold leading-8 text-[#111827]"),
    h5: (props: ComponentPropsWithoutRef<"h5"> & ExtraProps) =>
      renderProjectedElement("h5", props, "mt-7 text-[17px] font-semibold leading-8 text-[#111827]"),
    h6: (props: ComponentPropsWithoutRef<"h6"> & ExtraProps) =>
      renderProjectedElement("h6", props, "mt-7 text-[15px] font-semibold leading-7 text-[#111827]"),
    p: (props: ComponentPropsWithoutRef<"p"> & ExtraProps) => {
      const metadata = getBlockMetadata(props.node);

      if (metadata?.kind === "blockquote" || metadata?.kind === "list-item") {
        return renderProjectedElement("p", props, "m-0");
      }

      return renderProjectedElement(
        "p",
        props,
        "mt-4 text-[18px] leading-10 text-[#4B5563]",
      );
    },
    blockquote: (props: ComponentPropsWithoutRef<"blockquote"> & ExtraProps) =>
      createElementWithChildren(
        "blockquote",
        props,
        "mt-8 border-l-[3px] border-[#E5E7EB] pl-6 text-[17px] italic leading-10 text-[#6B7280]",
      ),
    ul: (props: ComponentPropsWithoutRef<"ul"> & ExtraProps) =>
      createElementWithChildren("ul", props, "mt-4 list-disc space-y-3 pl-6"),
    ol: (props: ComponentPropsWithoutRef<"ol"> & ExtraProps) =>
      createElementWithChildren("ol", props, "mt-4 list-decimal space-y-3 pl-6"),
    li: (props: ComponentPropsWithoutRef<"li"> & ExtraProps) => {
      const metadata = getBlockMetadata(props.node);

      if (!metadata) {
        return createElementWithChildren("li", props, "text-[18px] leading-10 text-[#4B5563]");
      }

      if (input.hiddenBlockKeys?.has(metadata.blockKey)) {
        return null;
      }

      const block = input.blocksByKey.get(metadata.blockKey);

      if (!block || block.selectable === false || hasDirectParagraphChild(props.node)) {
        return createElementWithChildren("li", props, "text-[18px] leading-10 text-[#4B5563]");
      }

      const nestedChildren = Children.toArray(props.children).filter((child) =>
        isValidElement(child) &&
        (child.type === "ul" || child.type === "ol"),
      );
      const inlineNodes = (props.node?.children ?? []).filter(
        (child) => !isElementTag(child, "ul") && !isElementTag(child, "ol"),
      );

      return createElementWithChildren(
        "li",
        props,
        "text-[18px] leading-10 text-[#4B5563]",
        <>
          <ProjectedInlineRenderer
            activeAnnotationId={input.activeAnnotationId}
            activeSearchMatchId={input.activeSearchMatchId}
            blockKey={metadata.blockKey}
            nodes={inlineNodes}
            onSelectAnnotation={input.onSelectAnnotation}
            runs={input.runsByBlockKey[metadata.blockKey] ?? []}
          />
          {nestedChildren}
        </>,
      );
    },
    pre: (props: ComponentPropsWithoutRef<"pre"> & ExtraProps) =>
      renderPreformattedBlock(props, input.blocksByKey),
    code: (props: ComponentPropsWithoutRef<"code"> & ExtraProps) => {
      const metadata = getBlockMetadata(props.node);
      const className = props.className ? String(props.className) : "";

      if (metadata && input.hiddenBlockKeys?.has(metadata.blockKey)) {
        return null;
      }

      if (metadata) {
        const block = input.blocksByKey.get(metadata.blockKey);

        if (!block || block.selectable === false) {
          return createElementWithChildren(
            "code",
            props,
            "whitespace-pre-wrap",
          );
        }

        return createElementWithChildren(
          "code",
          props,
          "whitespace-pre-wrap",
          <ProjectedInlineRenderer
            activeAnnotationId={input.activeAnnotationId}
            activeSearchMatchId={input.activeSearchMatchId}
            blockKey={metadata.blockKey}
            nodes={props.node?.children ?? []}
            onSelectAnnotation={input.onSelectAnnotation}
            runs={input.runsByBlockKey[metadata.blockKey] ?? []}
          />,
        );
      }

      if (className.includes("language-mermaid")) {
        return createElementWithChildren("code", props, "whitespace-pre-wrap");
      }

      return createElementWithChildren(
        "code",
        props,
        "rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[0.92em] text-[#374151]",
      );
    },
    table: (props: ComponentPropsWithoutRef<"table"> & ExtraProps) => (
      <div className="mt-8 overflow-x-auto rounded-[16px] border border-[#E5E7EB]">
        {createElementWithChildren("table", props, "min-w-full border-collapse text-left")}
      </div>
    ),
    thead: (props: ComponentPropsWithoutRef<"thead"> & ExtraProps) =>
      createElementWithChildren("thead", props, "bg-[#F9FAFB]"),
    tbody: (props: ComponentPropsWithoutRef<"tbody"> & ExtraProps) =>
      createElementWithChildren("tbody", props),
    tr: (props: ComponentPropsWithoutRef<"tr"> & ExtraProps) =>
      createElementWithChildren("tr", props, "border-t border-[#E5E7EB]"),
    th: (props: ComponentPropsWithoutRef<"th"> & ExtraProps) =>
      renderProjectedElement("th", props, "px-4 py-3 text-[14px] font-semibold text-[#111827]"),
    td: (props: ComponentPropsWithoutRef<"td"> & ExtraProps) =>
      renderProjectedElement("td", props, "px-4 py-3 text-[14px] leading-7 text-[#4B5563]"),
    a: (props: ComponentPropsWithoutRef<"a"> & ExtraProps) =>
      createElementWithChildren("a", props, "text-[#2563EB] underline underline-offset-4"),
    img: (props: ComponentPropsWithoutRef<"img"> & ExtraProps) =>
      createElementWithChildren("img", props, "my-6 rounded-[16px]"),
  };
}

function buildPreviewRuns(input: {
  annotationSegments: AnnotationSegment[];
  block: PreviewBlock;
  highlightMatches: HighlightMatch[];
  searchMatches: SearchMatch[];
}) {
  return buildBlockRuns({
    textLength: input.block.text.length,
    highlightMatches: input.highlightMatches,
    searchMatches: input.searchMatches,
    annotationSegments: input.annotationSegments,
  });
}

function getBlockMetadata(node?: Element) {
  const blockKey = getStringProperty(node?.properties, "data-block-key");

  if (!blockKey) {
    return null;
  }

  return {
    blockKey,
    kind: getStringProperty(node?.properties, "data-block-kind"),
  };
}

function createElementWithChildren(
  tagName: string,
  props: BlockComponentProps,
  className?: string,
  children?: ReactNode,
) {
  const mergedClassName = mergeClasses(
    typeof props.className === "string" ? props.className : undefined,
    className,
  );

  const nextProps = {
    ...props,
    className: mergedClassName,
  };
  const nextChildren = children ?? props.children;

  if (isVoidHtmlTag(tagName)) {
    const { children: voidChildren, ...voidProps } = nextProps;

    void voidChildren;

    return createElement(tagName, voidProps);
  }

  return createElement(tagName, nextProps, nextChildren);
}

function mergeClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ") || undefined;
}

function getStringProperty(
  properties: Element["properties"] | undefined,
  key: string,
) {
  const value = properties?.[key];

  return typeof value === "string" ? value : null;
}

function hasDirectParagraphChild(node?: Element) {
  return (node?.children ?? []).some((child) => isElementTag(child, "p"));
}

function isElementTag(node: RootContent | undefined, tagName: string): node is Element {
  return node?.type === "element" && node.tagName === tagName;
}

type BlockComponentProps = ComponentPropsWithoutRef<"div"> & ExtraProps;

function isVoidHtmlTag(tagName: string) {
  return VOID_HTML_TAGS.has(tagName);
}

function renderPreformattedBlock(
  props: ComponentPropsWithoutRef<"pre"> & ExtraProps,
  blocksByKey: Map<string, PreviewBlock>,
) {
  const metadata = getCodeChildMetadata(props.node);

  if (metadata) {
    const block = blocksByKey.get(metadata.blockKey);

    if (block?.selectable === false && block.attrs?.language === "mermaid") {
      return <MermaidBlock code={block.text} />;
    }
  }

  return createElementWithChildren(
    "pre",
    props,
    "mt-8 overflow-x-auto rounded-[16px] border border-[#E5E7EB] bg-[#111827] px-5 py-4 text-[14px] leading-7 text-[#F9FAFB]",
  );
}

function getCodeChildMetadata(node?: Element) {
  const codeChild = node?.children.find((child) => isElementTag(child, "code"));

  return codeChild ? getBlockMetadata(codeChild) : null;
}
